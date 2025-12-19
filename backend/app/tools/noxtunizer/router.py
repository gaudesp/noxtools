"""FastAPI routes for Noxtunizer-specific operations."""

from __future__ import annotations

from fastapi import APIRouter, Depends, File, UploadFile
from fastapi.responses import FileResponse
from sqlmodel import Session

from app.db import get_session
from app.jobs.schemas import JobEnqueued, JobsEnqueued
from app.jobs.service import JobService
from app.tools.noxtunizer.schemas import NoxtunizerJobRequest
from app.tools.noxtunizer.service import (
  download_source as download_noxtunizer_source,
  enqueue_jobs as enqueue_noxtunizer_jobs,
)
from app.tools.noxtunizer.validator import validate_request as validate_noxtunizer_request

router = APIRouter(prefix="/api/noxtunizer", tags=["noxtunizer"])


def get_job_service(session: Session = Depends(get_session)) -> JobService:
  """Dependency injector for JobService."""
  return JobService(session)


@router.get("/health")
def health() -> dict:
  """Health check for the Noxtunizer tool."""
  return {"status": "ok", "service": "noxtunizer"}


@router.post("/jobs", response_model=JobsEnqueued)
async def create_job(
  files: list[UploadFile] = File(...),
  job_service: JobService = Depends(get_job_service),
) -> JobsEnqueued:
  """Create Noxtunizer jobs."""
  payload = NoxtunizerJobRequest(files=files)
  params = validate_noxtunizer_request(payload)
  jobs = enqueue_noxtunizer_jobs(params, job_service)
  return JobsEnqueued(
    jobs=[
      JobEnqueued(job_id=job.id, filename=job.input_filename) for job in jobs
    ],
  )


@router.get("/source/{job_id}")
def download_source(
  job_id: str,
  job_service: JobService = Depends(get_job_service),
) -> FileResponse:
  """Stream the original uploaded audio for a given job."""
  return download_noxtunizer_source(job_id, job_service)
