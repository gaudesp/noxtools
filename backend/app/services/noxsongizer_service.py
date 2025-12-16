"""Noxsongizer service for uploads, file handling, and Demucs execution."""

from __future__ import annotations

import shutil
from pathlib import Path
from typing import List, Optional, Tuple

from fastapi import UploadFile

from app.executors.noxsongizer_executor import NoxsongizerExecutor
from app.models.job import Job, JobTool, JobUpdate
from app.services.job_cleanup import JobCleanupService
from app.services.job_service import JobService


class NoxsongizerService:
  """Handles Noxsongizer uploads and processing."""

  BASE_UPLOAD = Path("media/noxsongizer/uploads")
  BASE_OUTPUT = Path("media/noxsongizer/outputs")

  def __init__(self, job_service: JobService) -> None:
    self.job_service = job_service
    self.BASE_UPLOAD.mkdir(parents=True, exist_ok=True)
    self.BASE_OUTPUT.mkdir(parents=True, exist_ok=True)
    self.executor = NoxsongizerExecutor(base_output=self.BASE_OUTPUT)

  def create_jobs(self, files: List[UploadFile]) -> List[Tuple[Job, UploadFile]]:
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

  def process_job(self, job: Job) -> None:
    """
    Execute Demucs for a given job and persist resulting stems.

    Args:
      job: Job entity with an uploaded input file.
    """
    try:
      output_dir, stems = self.executor.execute(job)
    except BaseException as exc:  # noqa: BLE001
      self.job_service.mark_error(job.id, str(exc))
      JobCleanupService().cleanup_job_files(job, output_base=self.executor.base_output)
      return

    self.job_service.mark_completed(
      job.id,
      output_path=str(output_dir),
      output_files=stems,
      result={"stems": stems},
    )

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
