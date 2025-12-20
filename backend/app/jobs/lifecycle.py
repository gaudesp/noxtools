"""Centralized job lifecycle orchestration and cleanup."""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from pathlib import Path
from typing import Optional

from sqlmodel import Session, select

from app.errors import ConflictError
from app.jobs.cleanup import JobCleanupService
from app.jobs.file_links import JobFileRole, JobFileService
from app.jobs.model import Job, JobStatus
from app.jobs.schemas import JobExecutionResult
from app.jobs.service import JobService
from app.utils.files import safe_rmtree


class JobAbortReason(str, Enum):
  """Canonical reasons for aborting a running job."""

  USER_CANCELLED = "user_cancelled"
  SHUTDOWN = "shutdown"
  SYSTEM = "system"


@dataclass(frozen=True)
class AbortPolicy:
  """Single source of truth for abort messaging and cleanup."""

  message: str
  cleanup_outputs: bool


ABORT_POLICIES: dict[JobAbortReason, AbortPolicy] = {
  JobAbortReason.USER_CANCELLED: AbortPolicy(
    message="Job cancelled by user",
    cleanup_outputs=True,
  ),
  JobAbortReason.SHUTDOWN: AbortPolicy(
    message="Job interrupted by server shutdown",
    cleanup_outputs=True,
  ),
  JobAbortReason.SYSTEM: AbortPolicy(
    message="Job aborted",
    cleanup_outputs=True,
  ),
}


class JobLifecycleService:
  """
  Owns all terminal job transitions and output cleanup.

  This isolates lifecycle decisions away from workers/executors so there is a
  single source of truth for messaging and cleanup behaviour.
  """

  def __init__(self, session: Session) -> None:
    self.session = session
    self.job_service = JobService(session)
    self.cleanup = JobCleanupService()
    self.file_links = JobFileService(session)

  def mark_running(self, job_id: str, *, worker_id: str, attempt: int) -> Optional[Job]:
    """Mark a job as running and lock it to a worker."""
    return self.job_service.mark_running(job_id, worker_id=worker_id, attempt=attempt)

  def complete(self, job_id: str, payload: JobExecutionResult) -> Optional[Job]:
    """Finalize a job as done with persisted outputs."""
    created_links: list[tuple[str, JobFileRole]] = []
    output_names: list[str] = []

    try:
      for output in payload.output_files:
        file = self.file_links.file_service.create_from_path(
          output.path,
          file_type=output.type,
          name=output.name,
          format=output.format,
          quality=output.quality,
        )
        self.file_links.link(
          job_id,
          file.id,
          JobFileRole.OUTPUT,
          label=output.label,
        )
        created_links.append((file.id, JobFileRole.OUTPUT))
        output_names.append(file.name)

      result = self._build_result(job_id, payload.summary)
      return self.job_service.mark_completed(
        job_id,
        output_path=None,
        output_files=output_names,
        result=result,
      )
    except Exception:
      for file_id, role in created_links:
        try:
          self.file_links.unlink(job_id, file_id, role)
        except Exception:
          pass
      raise
    finally:
      self._cleanup_paths(payload.cleanup_paths)

  def fail(self, job_id: str, message: str) -> Optional[Job]:
    """Mark a job as errored and clean outputs."""
    job = self.job_service.mark_error(job_id, message)
    if job and job.status != JobStatus.ABORTED:
      self._cleanup_outputs(job)
    return job

  def abort(
    self,
    job_id: str,
    *,
    reason: JobAbortReason,
    cleanup_outputs: bool | None = None,
  ) -> Optional[Job]:
    """Abort a job with a canonical reason."""
    policy = ABORT_POLICIES.get(reason, ABORT_POLICIES[JobAbortReason.SYSTEM])
    job = self.job_service.mark_aborted(job_id, message=policy.message)
    should_cleanup = policy.cleanup_outputs if cleanup_outputs is None else cleanup_outputs
    if job and should_cleanup:
      self._cleanup_outputs(job)
    return job

  def abort_if_running(
    self,
    job_id: str,
    *,
    reason: JobAbortReason,
  ) -> Optional[Job]:
    """Abort only if the job is still running."""
    job = self.job_service.get_job(job_id)
    if not job or job.status != JobStatus.RUNNING:
      return job
    return self.abort(job_id, reason=reason)

  def abort_for_cancellation(self, job_id: str, *, shutdown_requested: bool) -> Optional[Job]:
    """Abort a job after cooperative cancellation."""
    reason = JobAbortReason.SHUTDOWN if shutdown_requested else JobAbortReason.USER_CANCELLED
    job = self.abort_if_running(job_id, reason=reason)
    if job and job.status == JobStatus.ABORTED:
      self._cleanup_outputs(job)
    return job

  def abort_running_jobs(
    self,
    *,
    reason: JobAbortReason,
  ) -> list[str]:
    """
    Abort all jobs currently marked as running.

    Safe to call from shutdown paths and worker cancellation; idempotent when a
    job already transitioned out of RUNNING.
    """
    jobs = self.session.exec(select(Job).where(Job.status == JobStatus.RUNNING)).all()
    aborted: list[str] = []
    for job in jobs:
      try:
        updated = self.abort(job.id, reason=reason)
        if updated:
          aborted.append(updated.id)
      except ConflictError:
        continue
      except Exception:
        self.session.rollback()
        continue
    return aborted

  def recover_running_jobs(self) -> list[str]:
    """Abort orphaned running jobs after a crash/restart."""
    return self.abort_running_jobs(reason=JobAbortReason.SHUTDOWN)

  def retry(self, job_id: str) -> Optional[Job]:
    """Reset an aborted/errored job to pending and clean outputs."""
    job = self.job_service.get_job(job_id)
    if not job:
      return None
    if job.status not in (JobStatus.ERROR, JobStatus.ABORTED):
      raise ConflictError("Only errored or aborted jobs can be retried")

    self._cleanup_outputs(job, keep_input=True)
    return self.job_service.retry_job(job_id)

  def cleanup_artifacts(self, job: Job, *, keep_input: bool) -> None:
    """Expose filesystem cleanup without leaking policies to callers."""
    self._cleanup_outputs(job, keep_input=keep_input)

  def _cleanup_outputs(self, job: Job, *, keep_input: bool = True) -> None:
    """Best-effort cleanup of job outputs."""
    try:
      self.cleanup.cleanup_job_files(job, keep_input=keep_input)
    except Exception:
      pass

  def _cleanup_paths(self, paths: list[Path] | None) -> None:
    for path in paths or []:
      try:
        safe_rmtree(path)
      except Exception:
        pass

  def _build_result(self, job_id: str, summary: dict) -> dict:
    return self.file_links.build_result_payload(job_id, summary)
