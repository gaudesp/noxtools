from __future__ import annotations

from typing import Any, Optional

from sqlmodel import Session

from app.models.job import Job, JobCreate, JobStatus, JobTool, JobUpdate, _utcnow
from app.events.job_events import job_event_bus
from app.repositories.job_repository import JobRepository


class JobService:
  """
  Unified job service shared by all tools.
  Handles creation, status transitions, and output bookkeeping.
  """

  def __init__(self, session: Session) -> None:
    self.repo = JobRepository(session)

  # -----------------------------
  # Creation / retrieval
  # -----------------------------
  def create_job(
    self,
    *,
    tool: JobTool,
    input_filename: Optional[str] = None,
    input_path: Optional[str] = None,
    params: Optional[dict[str, Any]] = None,
    max_attempts: int = 1,
  ) -> Job:
    payload = JobCreate(
      tool=tool,
      status=JobStatus.PENDING,
      input_filename=input_filename,
      input_path=input_path,
      params=params or {},
      max_attempts=max_attempts,
    )
    job = self.repo.create(payload)
    job_event_bus.publish_sync({"type": "job_created", "job": job.model_dump(mode="json")})
    return job

  def get_job(self, job_id: str) -> Optional[Job]:
    return self.repo.get(job_id)

  def list_jobs(
    self,
    *,
    tool: Optional[JobTool] = None,
    status: Optional[JobStatus] = None,
    offset: int = 0,
    limit: int = 50,
  ) -> list[Job]:
    return self.repo.list(tool=tool, status=status, offset=offset, limit=limit)

  def count_jobs(
    self,
    *,
    tool: Optional[JobTool] = None,
    status: Optional[JobStatus] = None,
  ) -> int:
    return self.repo.count(tool=tool, status=status)

  # -----------------------------
  # Status transitions
  # -----------------------------
  def mark_running(
    self,
    job_id: str,
    *,
    worker_id: Optional[str] = None,
    attempt: Optional[int] = None,
  ) -> Optional[Job]:
    update = JobUpdate(
      status=JobStatus.RUNNING,
      started_at=_utcnow(),
      locked_at=_utcnow(),
      locked_by=worker_id,
      attempt=attempt,
    )
    job = self.repo.update(job_id, update)
    if job:
      job_event_bus.publish_sync({"type": "job_updated", "job": job.model_dump(mode="json")})
    return job

  def mark_completed(
    self,
    job_id: str,
    *,
    output_path: Optional[str],
    output_files: Optional[list[str]] = None,
    result: Optional[dict[str, Any]] = None,
  ) -> Optional[Job]:
    update = JobUpdate(
      status=JobStatus.DONE,
      output_path=output_path,
      output_files=output_files,
      result=result,
      completed_at=_utcnow(),
      locked_at=None,
      locked_by=None,
    )
    job = self.repo.update(job_id, update)
    if job:
      job_event_bus.publish_sync({"type": "job_updated", "job": job.model_dump(mode="json")})
    return job

  def mark_error(self, job_id: str, message: str) -> Optional[Job]:
    update = JobUpdate(
      status=JobStatus.ERROR,
      error_message=message,
      completed_at=_utcnow(),
      locked_at=None,
      locked_by=None,
    )
    job = self.repo.update(job_id, update)
    if job:
      job_event_bus.publish_sync({"type": "job_updated", "job": job.model_dump(mode="json")})
    return job

  def update_outputs(
    self,
    job_id: str,
    *,
    output_path: Optional[str] = None,
    output_files: Optional[list[str]] = None,
    result: Optional[dict[str, Any]] = None,
  ) -> Optional[Job]:
    update = JobUpdate(
      output_path=output_path,
      output_files=output_files,
      result=result,
    )
    job = self.repo.update(job_id, update)
    if job:
      job_event_bus.publish_sync({"type": "job_updated", "job": job.model_dump(mode="json")})
    return job

  def update_status(self, job_id: str, status: JobStatus) -> Optional[Job]:
    update = JobUpdate(status=status)
    job = self.repo.update(job_id, update)
    if job:
      job_event_bus.publish_sync({"type": "job_updated", "job": job.model_dump(mode="json")})
    return job

  def update_job(self, job_id: str, payload: JobUpdate) -> Optional[Job]:
    job = self.repo.update(job_id, payload)
    if job:
      job_event_bus.publish_sync({"type": "job_updated", "job": job.model_dump(mode="json")})
    return job

  def delete_job(self, job_id: str) -> bool:
    deleted = self.repo.delete(job_id)
    if deleted:
      job_event_bus.publish_sync({"type": "job_deleted", "job_id": job_id})
    return deleted
