"""FastAPI routes for generic job operations."""

from __future__ import annotations

import asyncio
import json
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse
from sqlmodel import Session

from app.db import get_session
from app.events.job_events import job_event_bus
from app.models.job import JobRead, JobStatus, JobTool
from app.services.job_deletion_service import JobDeletionForbidden, JobDeletionService, JobNotFound
from app.services.job_lifecycle_service import JobAbortReason, JobLifecycleService
from app.services.job_service import JobService

router = APIRouter(prefix="/api/jobs", tags=["jobs"], redirect_slashes=False)


def get_job_service(session: Session = Depends(get_session)) -> JobService:
  """Dependency injector for JobService."""
  return JobService(session)


def get_job_lifecycle(session: Session = Depends(get_session)) -> JobLifecycleService:
  """Dependency injector for JobLifecycleService."""
  return JobLifecycleService(session)


def get_job_deletion(session: Session = Depends(get_session)) -> JobDeletionService:
  """Dependency injector for JobDeletionService."""
  return JobDeletionService(session)


class PaginatedJobs(BaseModel):
  """Response envelope for paginated job listings."""

  items: list[JobRead]
  total: int
  limit: int
  offset: int


@router.get("", response_model=PaginatedJobs)
def list_jobs(
  tool: Optional[JobTool] = Query(default=None, description="Filter by tool."),
  status: Optional[JobStatus] = Query(default=None, description="Filter by status."),
  limit: int = Query(default=50, ge=1, le=200),
  offset: int = Query(default=0, ge=0),
  job_service: JobService = Depends(get_job_service),
) -> PaginatedJobs:
  """List jobs with optional tool/status filters and pagination."""
  items = job_service.list_jobs(tool=tool, status=status, limit=limit, offset=offset)
  total = job_service.count_jobs(tool=tool, status=status)
  return PaginatedJobs(items=items, total=total, limit=limit, offset=offset)


@router.get("/stream")
async def stream_jobs() -> EventSourceResponse:
  """
  Stream job lifecycle events over Server-Sent Events.

  Each event carries a JSON payload with a `type` and associated job data.
  """
  queue = job_event_bus.subscribe()

  async def event_generator():
    try:
      while True:
        event = await queue.get()
        yield {
          "event": event.get("type", "message"),
          "data": json.dumps(event),
        }
    except asyncio.CancelledError:
      raise
    finally:
      job_event_bus.unsubscribe(queue)

  return EventSourceResponse(event_generator())


@router.get("/{job_id}", response_model=JobRead)
def get_job(job_id: str, job_service: JobService = Depends(get_job_service)) -> JobRead:
  """Retrieve a single job by id."""
  job = job_service.get_job(job_id)
  if not job:
    raise HTTPException(status_code=404, detail="Job not found")
  return job


@router.delete("/{job_id}")
def delete_job(
  job_id: str,
  deletion: JobDeletionService = Depends(get_job_deletion),
) -> dict:
  """
  Delete a job if it is not running, and remove associated files.
  """
  try:
    deletion.delete_job_and_artifacts(job_id)
  except JobNotFound:
    raise HTTPException(status_code=404, detail="Job not found")
  except JobDeletionForbidden as exc:
    raise HTTPException(status_code=409, detail=str(exc))
  return {"status": "deleted", "job_id": job_id}


@router.post("/{job_id}/retry", response_model=JobRead)
def retry_job(
  job_id: str,
  lifecycle: JobLifecycleService = Depends(get_job_lifecycle),
) -> JobRead:
  """
  Retry a previously failed or aborted job.
  """
  job = lifecycle.job_service.get_job(job_id)
  if not job:
    raise HTTPException(status_code=404, detail="Job not found")
  if job.status not in (JobStatus.ERROR, JobStatus.ABORTED):
    raise HTTPException(status_code=409, detail="Only failed or aborted jobs can be retried")

  try:
    updated = lifecycle.retry(job_id)
  except ValueError as exc:
    raise HTTPException(status_code=409, detail=str(exc))

  if not updated:
    raise HTTPException(status_code=404, detail="Job not found")
  return updated


@router.post("/{job_id}/cancel", response_model=JobRead)
def cancel_job(
  job_id: str,
  lifecycle: JobLifecycleService = Depends(get_job_lifecycle),
) -> JobRead:
  """
  Cancel an in-flight job, marking it as aborted and clearing outputs.
  """
  job = lifecycle.job_service.get_job(job_id)
  if not job:
    raise HTTPException(status_code=404, detail="Job not found")
  if job.status != JobStatus.RUNNING:
    raise HTTPException(status_code=409, detail="Only running jobs can be cancelled")

  try:
    updated = lifecycle.abort(job_id, reason=JobAbortReason.USER_CANCELLED)
  except ValueError as exc:
    raise HTTPException(status_code=409, detail=str(exc))

  if not updated:
    raise HTTPException(status_code=404, detail="Job not found")
  return updated
