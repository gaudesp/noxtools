"""FastAPI routes for Noxelizer-specific operations."""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile
from fastapi.responses import FileResponse
from sqlmodel import Session

from app.db import get_session
from app.jobs.schemas import JobEnqueued, JobsEnqueued
from app.jobs.service import JobService
from app.tools.noxelizer.schemas import NoxelizerJobRequest
from app.tools.noxelizer.service import (
  download_output as download_noxelizer_output,
  download_source as download_noxelizer_source,
  enqueue_jobs as enqueue_noxelizer_jobs,
)
from app.tools.noxelizer.validator import validate_request as validate_noxelizer_request

router = APIRouter(prefix="/api/noxelizer", tags=["noxelizer"])


def get_job_service(session: Session = Depends(get_session)) -> JobService:
  """Dependency injector for JobService."""
  return JobService(session)


@router.get("/health")
def health() -> dict:
  """Health check for the Noxelizer tool."""
  return {"status": "ok", "service": "noxelizer"}


@router.post("/jobs", response_model=JobsEnqueued)
async def create_job(
  files: list[UploadFile] = File(...),
  fps: Optional[int] = Form(None),
  duration: Optional[float] = Form(None),
  final_hold: Optional[float] = Form(None),
  job_service: JobService = Depends(get_job_service),
) -> JobsEnqueued:
  """Create Noxelizer jobs."""
  payload = NoxelizerJobRequest(
    files=files,
    fps=fps,
    duration=duration,
    final_hold=final_hold,
  )
  params = validate_noxelizer_request(payload)
  jobs = enqueue_noxelizer_jobs(params, job_service)
  return JobsEnqueued(
    jobs=[
      JobEnqueued(job_id=job.id, filename=job.input_filename) for job in jobs
    ],
  )


@router.get("/source/{job_id}")
def download_source(
  job_id: str,
  variant: Optional[str] = Query(
    None,
    description="Image variant to return (e.g. thumb). Defaults to original.",
  ),
  job_service: JobService = Depends(get_job_service),
) -> FileResponse:
  """Stream the uploaded image or one of its variants for a given job."""
  return download_noxelizer_source(job_id, job_service, variant=variant)


@router.get("/download/{job_id}/{filename}")
def download_output(
  job_id: str,
  filename: str,
  job_service: JobService = Depends(get_job_service),
) -> FileResponse:
  """Download the generated output for a given job."""
  return download_noxelizer_output(job_id, filename, job_service)
