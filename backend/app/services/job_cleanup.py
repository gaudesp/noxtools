"""Cleanup helpers for job-related filesystem artifacts."""

from __future__ import annotations

import shutil
from pathlib import Path

from sqlmodel import Session, select

from app.models.job import Job, JobStatus
from app.services.job_service import JobService


class JobCleanupService:
  """Handles best-effort cleanup and recovery of job-related filesystem artifacts."""

  def cleanup_job_files(
    self,
    job: Job,
    *,
    output_base: Path | None = None,
    keep_input: bool = True,
  ) -> None:
    """
    Cleanup filesystem artifacts associated with a job.

    By default, input files are preserved to allow preview, debugging,
    and potential job re-runs.
    """
    if not keep_input and job.input_path:
      self._safe_remove(Path(job.input_path).parent)

    if job.output_path:
      self._safe_remove(Path(job.output_path))
    elif output_base:
      self._safe_remove(output_base / job.id)

  def recover_running_jobs(
    self,
    *,
    session: Session,
  ) -> None:
    """
    Recover jobs left in RUNNING state after an unexpected server shutdown.

    Jobs are marked as ERROR, outputs are cleaned, and inputs are preserved.
    """
    job_service = JobService(session)

    jobs = session.exec(
      select(Job).where(Job.status == JobStatus.RUNNING)
    ).all()

    for job in jobs:
      job_service.mark_error(
        job.id,
        "Job interrupted by server shutdown",
      )

      self.cleanup_job_files(
        job,
        keep_input=True,
      )

  def _safe_remove(self, path: Path) -> None:
    """Best-effort directory removal without raising upstream errors."""
    try:
      if path.exists():
        shutil.rmtree(path)
    except Exception:
      pass
