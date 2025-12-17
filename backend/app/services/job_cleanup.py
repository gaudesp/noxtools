"""Cleanup helpers for job-related filesystem artifacts."""

from __future__ import annotations

import shutil
from pathlib import Path

from sqlmodel import Session, select

from app.models.job import Job, JobStatus, JobTool


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
    resolved_output_base = output_base or self._default_output_base(job)

    if not keep_input and job.input_path:
      self._safe_remove(Path(job.input_path).parent)

    if job.output_path:
      self._safe_remove(Path(job.output_path))
    elif resolved_output_base:
      self._safe_remove(resolved_output_base / job.id)

  def recover_running_jobs(
    self,
    *,
    session: Session,
  ) -> None:
    """
    Recover jobs left in RUNNING state after an unexpected server shutdown.

    Jobs are marked as ABORTED, outputs are cleaned, and inputs are preserved.
    """
    from app.services.job_service import JobService

    job_service = JobService(session)

    jobs = session.exec(
      select(Job).where(Job.status == JobStatus.RUNNING)
    ).all()

    for job in jobs:
      try:
        job_service.mark_aborted(job.id, message="Job interrupted by server shutdown")
      except ValueError:
        continue

  def _safe_remove(self, path: Path) -> None:
    """Best-effort directory removal without raising upstream errors."""
    try:
      if path.exists():
        shutil.rmtree(path)
    except Exception:
      pass

  def _default_output_base(self, job: Job) -> Path | None:
    """Infer the default output directory base for a job's tool."""
    mapping: dict[JobTool, Path] = {
      JobTool.NOXSONGIZER: Path("media/noxsongizer/outputs"),
      JobTool.NOXELIZER: Path("media/noxelizer/outputs"),
      JobTool.NOXTUBIZER: Path("media/noxtubizer/outputs"),
      JobTool.NOXTUNIZER: Path("media/noxtunizer/outputs"),
    }
    return mapping.get(job.tool)
