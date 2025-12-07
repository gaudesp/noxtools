from __future__ import annotations

import shutil
import subprocess
from pathlib import Path
from typing import Any, List, Optional, Tuple

from fastapi import UploadFile

from app.models.job import Job, JobTool, JobUpdate
from app.services.job_service import JobService


class NoxsongizerService:
  BASE_UPLOAD = Path("media/uploads")
  BASE_OUTPUT = Path("media/outputs")

  def __init__(self, job_service: JobService) -> None:
    self.job_service = job_service
    self.BASE_UPLOAD.mkdir(parents=True, exist_ok=True)
    self.BASE_OUTPUT.mkdir(parents=True, exist_ok=True)

  # -----------------------------
  # Upload handling
  # -----------------------------
  def create_job_from_upload(self, file: UploadFile) -> Job:
    job = self.job_service.create_job(
      tool=JobTool.NOXSONGIZER,
      input_filename=file.filename,
    )

    upload_dir = self.BASE_UPLOAD / job.id
    upload_dir.mkdir(parents=True, exist_ok=True)

    dest = upload_dir / file.filename
    with dest.open("wb") as buffer:
      shutil.copyfileobj(file.file, buffer)

    self.job_service.update_job(job.id, JobUpdate(input_path=str(dest)))
    refreshed = self.job_service.get_job(job.id)
    return refreshed or job

  def create_jobs_from_uploads(self, files: List[UploadFile]) -> List[Tuple[Job, UploadFile]]:
    jobs_with_files: List[Tuple[Job, UploadFile]] = []
    for file in files:
      job = self.job_service.create_job(
        tool=JobTool.NOXSONGIZER,
        input_filename=file.filename,
      )

      upload_dir = self.BASE_UPLOAD / job.id
      upload_dir.mkdir(parents=True, exist_ok=True)

      dest = upload_dir / file.filename
      with dest.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

      self.job_service.update_job(job.id, JobUpdate(input_path=str(dest)))
      refreshed = self.job_service.get_job(job.id)
      jobs_with_files.append((refreshed or job, file))
    return jobs_with_files

  # -----------------------------
  # Worker executor
  # -----------------------------
  def process_job(self, job: Job) -> None:
    if not job.input_path:
      self.job_service.mark_error(job.id, "Input file is missing")
      return

    input_file = Path(job.input_path)
    if not input_file.exists():
      self.job_service.mark_error(job.id, "Input file not found on disk")
      return

    output_dir = self.BASE_OUTPUT / job.id
    output_dir.mkdir(parents=True, exist_ok=True)

    cmd = [
      "demucs",
      "-n",
      "htdemucs_ft",
      str(input_file),
    ]

    process = subprocess.run(
      cmd,
      stdout=subprocess.PIPE,
      stderr=subprocess.PIPE,
      text=True,
    )

    if process.returncode != 0:
      self.job_service.mark_error(job.id, process.stderr or "Demucs failed")
      return

    demucs_output_folder = self._find_demucs_output_folder(input_file)
    if not demucs_output_folder:
      self.job_service.mark_error(job.id, "Demucs output folder not found")
      return

    stems: List[str] = []

    for stem_path in demucs_output_folder.iterdir():
      if stem_path.is_file():
        target = output_dir / stem_path.name
        shutil.move(str(stem_path), str(target))
        stems.append(stem_path.name)

    try:
      shutil.rmtree(demucs_output_folder)
    except OSError:
      pass

    self.job_service.mark_completed(
      job.id,
      output_path=str(output_dir),
      output_files=stems,
      result={"stems": stems},
    )

  def _find_demucs_output_folder(self, input_file: Path) -> Optional[Path]:
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
