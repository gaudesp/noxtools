"""Noxsongizer service for uploads, file handling, and Demucs execution."""

from __future__ import annotations

import shutil
import subprocess
from pathlib import Path
from typing import List, Optional, Tuple

from fastapi import UploadFile

from app.models.job import Job, JobTool, JobUpdate
from app.services.job_service import JobService


class NoxsongizerService:
  """Handles Noxsongizer uploads and processing."""

  BASE_UPLOAD = Path("media/uploads")
  BASE_OUTPUT = Path("media/outputs")

  def __init__(self, job_service: JobService) -> None:
    self.job_service = job_service
    self.BASE_UPLOAD.mkdir(parents=True, exist_ok=True)
    self.BASE_OUTPUT.mkdir(parents=True, exist_ok=True)

  # ---------------------------------------------------------------------------#
  # Upload handling
  # ---------------------------------------------------------------------------#
  def create_job_from_upload(self, file: UploadFile) -> Job:
    """
    Create a job from a single uploaded file and persist it to disk.

    Args:
      file: Uploaded audio file.

    Returns:
      The created Job entity.
    """
    job = self.job_service.create_job(
      tool=JobTool.NOXSONGIZER,
      input_filename=file.filename,
    )
    dest = self._write_upload_file(job.id, file)
    if dest:
      self.job_service.update_job(job.id, JobUpdate(input_path=str(dest)))
    refreshed = self.job_service.get_job(job.id)
    return refreshed or job

  def create_jobs_from_uploads(self, files: List[UploadFile]) -> List[Tuple[Job, UploadFile]]:
    """
    Create jobs for a list of uploaded files.

    Args:
      files: Uploaded audio files.

    Returns:
      List of (job, original_upload_file) tuples.
    """
    jobs_with_files: List[Tuple[Job, UploadFile]] = []
    for file in files:
      job = self.job_service.create_job(
        tool=JobTool.NOXSONGIZER,
        input_filename=file.filename,
      )
      dest = self._write_upload_file(job.id, file)
      if dest:
        self.job_service.update_job(job.id, JobUpdate(input_path=str(dest)))
      refreshed = self.job_service.get_job(job.id)
      jobs_with_files.append((refreshed or job, file))
    return jobs_with_files

  # ---------------------------------------------------------------------------#
  # Worker executor
  # ---------------------------------------------------------------------------#
  def process_job(self, job: Job) -> None:
    """
    Execute Demucs for a given job and persist resulting stems.

    Args:
      job: Job entity with an uploaded input file.
    """
    if not job.input_path:
      self.job_service.mark_error(job.id, "Input file is missing")
      return

    input_file = Path(job.input_path)
    if not input_file.exists():
      self.job_service.mark_error(job.id, "Input file not found on disk")
      return

    output_dir = self.BASE_OUTPUT / job.id
    output_dir.mkdir(parents=True, exist_ok=True)

    process = self._run_demucs(input_file)
    if process is None:
      self.job_service.mark_error(job.id, "Demucs execution failed to start")
      return

    if process.returncode != 0:
      self.job_service.mark_error(job.id, process.stderr or "Demucs failed")
      return

    demucs_output_folder = self._find_demucs_output_folder(input_file)
    if not demucs_output_folder:
      self.job_service.mark_error(job.id, "Demucs output folder not found")
      return

    stems = self._move_outputs(demucs_output_folder, output_dir)
    self._cleanup_folder(demucs_output_folder)

    self.job_service.mark_completed(
      job.id,
      output_path=str(output_dir),
      output_files=stems,
      result={"stems": stems},
    )

  # ---------------------------------------------------------------------------#
  # Internal helpers
  # ---------------------------------------------------------------------------#
  def _write_upload_file(self, job_id: str, file: UploadFile) -> Optional[Path]:
    """
    Persist an uploaded file to the per-job uploads directory.

    Args:
      job_id: Job identifier.
      file: Uploaded file to persist.

    Returns:
      Path to the stored file, or None on failure.
    """
    upload_dir = self.BASE_UPLOAD / job_id
    upload_dir.mkdir(parents=True, exist_ok=True)
    dest = upload_dir / file.filename
    try:
      with dest.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    except Exception:
      return None
    return dest

  def _run_demucs(self, input_file: Path) -> Optional[subprocess.CompletedProcess[str]]:
    """
    Execute Demucs on the provided input file.

    Args:
      input_file: Path to the input audio file.

    Returns:
      CompletedProcess result, or None if execution failed to start.
    """
    cmd = [
      "demucs",
      "-n",
      "htdemucs_ft",
      str(input_file),
    ]
    try:
      return subprocess.run(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
      )
    except Exception:
      return None

  def _find_demucs_output_folder(self, input_file: Path) -> Optional[Path]:
    """
    Locate the Demucs output directory for a given input file.

    Args:
      input_file: Original input file path.

    Returns:
      Path to the Demucs output folder, or None if not found.
    """
    demucs_base = Path("separated/htdemucs_ft")
    if not demucs_base.exists():
      return None

    stem_name = input_file.stem
    candidate = demucs_base / stem_name
    if candidate.exists():
      return candidate

    matches = list(demucs_base.glob(f"{stem_name}*"))
    if matches:
      return matches[0]

    return None

  def _move_outputs(self, source_dir: Path, target_dir: Path) -> List[str]:
    """
    Move Demucs-generated stems into the job output directory.

    Args:
      source_dir: Directory containing Demucs outputs.
      target_dir: Destination directory for persisted stems.

    Returns:
      List of stem filenames that were moved.
    """
    stems: List[str] = []
    try:
      for stem_path in source_dir.iterdir():
        if stem_path.is_file():
          target = target_dir / stem_path.name
          shutil.move(str(stem_path), str(target))
          stems.append(stem_path.name)
    except Exception:
      return stems
    return stems

  def _cleanup_folder(self, path: Path) -> None:
    """
    Best-effort removal of a folder (used for Demucs temp outputs).

    Args:
      path: Folder to remove.
    """
    try:
      if path.exists():
        shutil.rmtree(path)
    except Exception:
      pass
