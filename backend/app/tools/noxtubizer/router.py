"""FastAPI routes for Noxtubizer operations."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from fastapi.responses import FileResponse
from sqlmodel import Session

from app.db import get_session
from app.jobs.schemas import JobEnqueued, JobsEnqueued
from app.jobs.service import JobService
from app.tools.noxtubizer.schemas import NoxtubizerJobRequest
from app.tools.noxtubizer.service import (
  download_output as download_noxtubizer_output,
  enqueue_jobs as enqueue_noxtubizer_jobs,
)
from app.tools.noxtubizer.validator import validate_request as validate_noxtubizer_request

router = APIRouter(prefix="/api/noxtubizer", tags=["noxtubizer"])


def get_job_service(session: Session = Depends(get_session)) -> JobService:
  """Dependency injector for JobService."""
  return JobService(session)


@router.get("/health")
def health() -> dict:
  """Health check for the Noxtubizer tool."""
  return {"status": "ok", "service": "noxtubizer"}


@router.post("/jobs", response_model=JobsEnqueued)
async def create_job(
  payload: NoxtubizerJobRequest,
  job_service: JobService = Depends(get_job_service),
) -> JobsEnqueued:
  """Create Noxtubizer jobs."""
  params = validate_noxtubizer_request(payload)
  jobs = enqueue_noxtubizer_jobs(params, job_service)
  return JobsEnqueued(
    jobs=[
      JobEnqueued(job_id=job.id, filename=job.input_filename) for job in jobs
    ],
  )


@router.get("/download/{job_id}/{filename}")
def download_output(
  job_id: str,
  filename: str,
  job_service: JobService = Depends(get_job_service),
) -> FileResponse:
  """Download an output artifact for a Noxtubizer job."""
  return download_noxtubizer_output(job_id, filename, job_service)
