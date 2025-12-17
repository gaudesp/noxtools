"""Business service layer for managing jobs."""

from __future__ import annotations

from typing import Any, Optional

from sqlmodel import Session

from app.events.job_events import JobEvent, job_event_bus
from app.models.job import Job, JobCreate, JobStatus, JobTool, JobUpdate, _utcnow
from app.repositories.job_repository import JobRepository


class JobService:
  """
  Tool-agnostic job orchestration.

  Handles lifecycle transitions, output bookkeeping, and event publishing while
  delegating persistence to the repository.
  """

  def __init__(self, session: Session) -> None:
    """
    Initialize the service with a SQLModel session.

    Args:
      session: Active SQLModel session used by the repository.
    """
    self.repo = JobRepository(session)

  def create_job(
    self,
    *,
    tool: JobTool,
    input_filename: Optional[str] = None,
    input_path: Optional[str] = None,
    params: Optional[dict[str, Any]] = None,
    max_attempts: int = 1,
  ) -> Job:
    """
    Create and persist a new job.

    Args:
      tool: Target tool that should process the job.
      input_filename: Original name of the uploaded file.
      input_path: Absolute path to the uploaded input file.
      params: Tool-specific parameters.
      max_attempts: How many times the worker may retry.

    Returns:
      The newly created Job entity.

    Raises:
      Exception: Propagates repository errors to caller.
    """
    payload = JobCreate(
      tool=tool,
      status=JobStatus.PENDING,
      input_filename=input_filename,
      input_path=input_path,
      params=params or {},
      max_attempts=max_attempts,
    )
    job = self.repo.create(payload)
    self._emit_event("job_created", job=job)
    return job

  def get_job(self, job_id: str) -> Optional[Job]:
    """
    Fetch a single job by id.

    Args:
      job_id: Identifier of the job.

    Returns:
      The job if found, otherwise None.
    """
    return self.repo.get(job_id)

  def list_jobs(
    self,
    *,
    tool: Optional[JobTool] = None,
    status: Optional[JobStatus] = None,
    offset: int = 0,
    limit: int = 50,
  ) -> list[Job]:
    """
    List jobs with optional filters.

    Args:
      tool: Optional tool filter.
      status: Optional status filter.
      offset: Rows to skip.
      limit: Maximum rows to return.

    Returns:
      A list of jobs.
    """
    return self.repo.list(tool=tool, status=status, offset=offset, limit=limit)

  def count_jobs(
    self,
    *,
    tool: Optional[JobTool] = None,
    status: Optional[JobStatus] = None,
  ) -> int:
    """
    Count jobs by optional tool/status filters.

    Args:
      tool: Optional tool filter.
      status: Optional status filter.

    Returns:
      The number of matching jobs.
    """
    return self.repo.count(tool=tool, status=status)

  def mark_running(
    self,
    job_id: str,
    *,
    worker_id: Optional[str] = None,
    attempt: Optional[int] = None,
  ) -> Optional[Job]:
    """
    Mark a job as running and lock it to a worker.

    Args:
      job_id: Identifier of the job.
      worker_id: Identifier of the worker acquiring the job.
      attempt: Attempt counter to set; defaults to previous + 1 if omitted.

    Returns:
      The updated job, or None if not found.
    """
    job = self.get_job(job_id)
    if not job:
      return None

    next_attempt = attempt if attempt is not None else (job.attempt + 1)
    update = JobUpdate(
      status=JobStatus.RUNNING,
      started_at=_utcnow() if job.started_at is None else job.started_at,
      locked_at=_utcnow(),
      locked_by=worker_id,
      attempt=next_attempt,
    )
    return self._update_and_emit(job_id, update)

  def mark_completed(
    self,
    job_id: str,
    *,
    output_path: Optional[str],
    output_files: Optional[list[str]] = None,
    result: Optional[dict[str, Any]] = None,
  ) -> Optional[Job]:
    """
    Mark a job as completed and store outputs.

    Args:
      job_id: Identifier of the job.
      output_path: Directory containing generated outputs.
      output_files: List of generated output files.
      result: Tool-specific result metadata.

    Returns:
      The updated job, or None if not found.
    """
    existing = self.get_job(job_id)
    if not existing or existing.status == JobStatus.ABORTED:
      return existing

    update = JobUpdate(
      status=JobStatus.DONE,
      output_path=output_path,
      output_files=output_files,
      result=result,
      completed_at=_utcnow(),
      locked_at=None,
      locked_by=None,
    )
    return self._update_and_emit(job_id, update)

  def mark_error(self, job_id: str, message: str) -> Optional[Job]:
    """
    Mark a job as errored with a message.

    Args:
      job_id: Identifier of the job.
      message: Error details.

    Returns:
      The updated job, or None if not found.
    """
    existing = self.get_job(job_id)
    if not existing:
      return None

    if existing.status == JobStatus.ABORTED:
      return existing

    try:
      from app.services.job_cleanup import JobCleanupService

      JobCleanupService().cleanup_job_files(existing, keep_input=True)
    except Exception:
      pass

    update = JobUpdate(
      status=JobStatus.ERROR,
      error_message=message,
      completed_at=_utcnow(),
      locked_at=None,
      locked_by=None,
    )
    return self._update_and_emit(job_id, update)

  def mark_aborted(
    self,
    job_id: str,
    *,
    message: Optional[str] = None,
    cleanup_outputs: bool = True,
  ) -> Optional[Job]:
    """
    Mark a running job as aborted, clear outputs, and release locks.

    Args:
      job_id: Identifier of the job to abort.
      message: Optional explanation for the abort.

    Returns:
      The updated job, or None if not found.

    Raises:
      ValueError: If the job is not currently running.
    """
    job = self.get_job(job_id)
    if not job:
      return None
    if job.status != JobStatus.RUNNING:
      raise ValueError("Only running jobs can be aborted")

    if cleanup_outputs:
      try:
        from app.services.job_cleanup import JobCleanupService

        JobCleanupService().cleanup_job_files(job, keep_input=True)
      except Exception:
        pass

    update = JobUpdate(
      status=JobStatus.ABORTED,
      error_message=message,
      completed_at=_utcnow(),
      locked_at=None,
      locked_by=None,
      output_path=None,
      output_files=[],
      result={},
    )
    return self._update_and_emit(job_id, update)

  def retry_job(self, job_id: str) -> Optional[Job]:
    """
    Reset a failed or aborted job back to pending.

    Args:
      job_id: Identifier of the job to retry.

    Returns:
      The updated job, or None if not found.

    Raises:
      ValueError: If the job is not retryable.
    """
    job = self.get_job(job_id)
    if not job:
      return None
    if job.status not in (JobStatus.ERROR, JobStatus.ABORTED):
      raise ValueError("Only errored or aborted jobs can be retried")

    try:
      from app.services.job_cleanup import JobCleanupService

      JobCleanupService().cleanup_job_files(job, keep_input=True)
    except Exception:
      pass

    update = JobUpdate(
      status=JobStatus.PENDING,
      output_path=None,
      output_files=[],
      result={},
      error_message=None,
      started_at=None,
      completed_at=None,
      locked_at=None,
      locked_by=None,
    )
    return self._update_and_emit(job_id, update)

  def update_outputs(
    self,
    job_id: str,
    *,
    output_path: Optional[str] = None,
    output_files: Optional[list[str]] = None,
    result: Optional[dict[str, Any]] = None,
  ) -> Optional[Job]:
    """
    Update output metadata without changing status.

    Args:
      job_id: Identifier of the job.
      output_path: Directory containing generated outputs.
      output_files: List of generated output files.
      result: Tool-specific result metadata.

    Returns:
      The updated job, or None if not found.
    """
    update = JobUpdate(
      output_path=output_path,
      output_files=output_files,
      result=result,
    )
    return self._update_and_emit(job_id, update)

  def update_status(self, job_id: str, status: JobStatus) -> Optional[Job]:
    """
    Update only the job status.

    Args:
      job_id: Identifier of the job.
      status: New status value.

    Returns:
      The updated job, or None if not found.
    """
    update = JobUpdate(status=status)
    return self._update_and_emit(job_id, update)

  def update_job(self, job_id: str, payload: JobUpdate) -> Optional[Job]:
    """
    Apply an arbitrary partial update to a job.

    Args:
      job_id: Identifier of the job.
      payload: Fields to patch.

    Returns:
      The updated job, or None if not found.
    """
    return self._update_and_emit(job_id, payload)

  def delete_job(self, job_id: str) -> bool:
    """
    Remove a job and emit deletion event.

    Args:
      job_id: Identifier of the job.

    Returns:
      True if deleted, False if missing.
    """
    deleted = self.repo.delete(job_id)
    if deleted:
      self._emit_event("job_deleted", job_id=job_id)
    return deleted

  def _update_and_emit(self, job_id: str, payload: JobUpdate) -> Optional[Job]:
    """
    Persist an update and emit a job_updated event.

    Args:
      job_id: Identifier of the job.
      payload: Update payload.

    Returns:
      The updated job if found, otherwise None.
    """
    job = self.repo.update(job_id, payload)
    if job:
      self._emit_event("job_updated", job=job)
    return job

  def _emit_event(self, event_type: str, **data: Any) -> None:
    """
    Safely publish a job event without raising upstream errors.

    Args:
      event_type: Event name.
      **data: Event payload.
    """
    try:
      if "job" in data and isinstance(data["job"], Job):
        event = JobEvent(type=event_type, payload={"job": data["job"].model_dump(mode="json")})
      else:
        event = JobEvent(type=event_type, payload=data)
      job_event_bus.publish_sync(event)
    except Exception:
      pass
