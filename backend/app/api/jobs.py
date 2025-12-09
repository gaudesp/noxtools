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
from app.services.job_cleanup import JobCleanupService
from app.services.job_service import JobService

router = APIRouter(prefix="/api/jobs", tags=["jobs"], redirect_slashes=False)


def get_job_service(session: Session = Depends(get_session)) -> JobService:
  """Dependency injector for JobService."""
  return JobService(session)


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
  job_service: JobService = Depends(get_job_service),
) -> dict:
  """
  Delete a job if it is not running, and remove associated files.
  """
  job = job_service.get_job(job_id)
  if not job:
    raise HTTPException(status_code=404, detail="Job not found")
  if job.status == JobStatus.RUNNING:
    raise HTTPException(status_code=409, detail="Cannot delete a running job")

  cleanup = JobCleanupService()
  cleanup.cleanup_job_files(job)
  job_service.delete_job(job_id)
  return {"status": "deleted", "job_id": job_id}
