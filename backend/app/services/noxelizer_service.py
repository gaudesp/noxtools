"""Noxelizer service for uploads, file handling, and video rendering."""

from __future__ import annotations

import shutil
from pathlib import Path
from typing import List, Optional, Tuple

from fastapi import UploadFile

from app.executors.noxelizer_executor import NoxelizerExecutor
from app.models.job import Job, JobTool, JobUpdate
from app.services.image_variant_service import ImageVariantService
from app.services.job_service import JobService
from app.workers.job_worker import CancellationToken
from app.workers.job_types import JobExecutionResult


class NoxelizerService:
  """Handles Noxelizer uploads and processing."""

  BASE_UPLOAD = Path("media/noxelizer/uploads")
  BASE_OUTPUT = Path("media/noxelizer/outputs")

  def __init__(self, job_service: JobService) -> None:
    self.job_service = job_service
    self.BASE_UPLOAD.mkdir(parents=True, exist_ok=True)
    self.BASE_OUTPUT.mkdir(parents=True, exist_ok=True)
    self.executor = NoxelizerExecutor(base_output=self.BASE_OUTPUT)

  def create_jobs(self, files: List[UploadFile]) -> List[Tuple[Job, UploadFile]]:
    """
    Create jobs for a list of uploaded files.

    Args:
      files: Uploaded image files.

    Returns:
      List of (job, original_upload_file) tuples.
    """
    jobs_with_files: List[Tuple[Job, UploadFile]] = []
    for file in files:
      job = self.job_service.create_job(
        tool=JobTool.NOXELIZER,
        input_filename=file.filename,
      )
      dest = self._write_upload_file(job.id, file)
      if dest:
        self.job_service.update_job(job.id, JobUpdate(input_path=str(dest)))
        ImageVariantService.create_variant(dest, variant="thumb")
      refreshed = self.job_service.get_job(job.id)
      jobs_with_files.append((refreshed or job, file))
    return jobs_with_files

  def process_job(self, job: Job, cancel_token: CancellationToken) -> JobExecutionResult:
    cancel_token.raise_if_cancelled()
    return self.executor.execute(job, cancel_token=cancel_token)

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
