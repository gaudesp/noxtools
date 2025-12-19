"""FastAPI routes for Noxsongizer-specific operations."""

from __future__ import annotations

from fastapi import APIRouter, Depends, File, UploadFile
from fastapi.responses import FileResponse
from sqlmodel import Session

from app.db import get_session
from app.jobs.schemas import JobEnqueued, JobsEnqueued
from app.jobs.service import JobService
from app.tools.noxsongizer.schemas import NoxsongizerJobRequest
from app.tools.noxsongizer.service import (
  download_output as download_noxsongizer_output,
  download_source as download_noxsongizer_source,
  enqueue_jobs as enqueue_noxsongizer_jobs,
)
from app.tools.noxsongizer.validator import validate_request as validate_noxsongizer_request

router = APIRouter(prefix="/api/noxsongizer", tags=["noxsongizer"])


def get_job_service(session: Session = Depends(get_session)) -> JobService:
  """Dependency injector for JobService."""
  return JobService(session)


@router.get("/health")
def health() -> dict:
  """Health check for the Noxsongizer tool."""
  return {"status": "ok", "service": "noxsongizer"}


@router.post("/jobs", response_model=JobsEnqueued)
async def create_job(
  files: list[UploadFile] = File(...),
  job_service: JobService = Depends(get_job_service),
) -> JobsEnqueued:
  """Create Noxsongizer jobs."""
  payload = NoxsongizerJobRequest(files=files)
  params = validate_noxsongizer_request(payload)
  jobs = enqueue_noxsongizer_jobs(params, job_service)
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
  return download_noxsongizer_source(job_id, job_service)


@router.get("/download/{job_id}/{stem_name}")
def download_output(
  job_id: str,
  stem_name: str,
  job_service: JobService = Depends(get_job_service),
) -> FileResponse:
  """Download a generated output file for the given job."""
  return download_noxsongizer_output(job_id, stem_name, job_service)
