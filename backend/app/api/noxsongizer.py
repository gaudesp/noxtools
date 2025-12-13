"""FastAPI routes for Noxsongizer-specific operations."""

from __future__ import annotations

from mimetypes import guess_type
from pathlib import Path
from typing import List

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlmodel import Session

from app.db import get_session
from app.models.job import JobTool
from app.services.job_service import JobService
from app.services.noxsongizer_service import NoxsongizerService

router = APIRouter(prefix="/api/noxsongizer", tags=["noxsongizer"])


def get_job_service(session: Session = Depends(get_session)) -> JobService:
  """Dependency injector for JobService."""
  return JobService(session)


def get_noxsongizer_service(job_service: JobService = Depends(get_job_service)) -> NoxsongizerService:
  """Dependency injector for NoxsongizerService."""
  return NoxsongizerService(job_service)


class CreateJobResponse(BaseModel):
  """Response envelope for a newly created job."""
  job_id: str


@router.get("/health")
def health() -> dict:
  """Health check for the Noxsongizer tool."""
  return {"status": "ok", "service": "noxsongizer"}


@router.post("/jobs", response_model=CreateJobResponse)
async def create_job(
  files: List[UploadFile] = File(...),
  service: NoxsongizerService = Depends(get_noxsongizer_service),
) -> CreateJobResponse:
  """
  Create a Noxsongizer job from a regular form submission.
  """
  jobs = service.create_jobs(files)

  if not jobs:
    raise HTTPException(status_code=400, detail="No valid file provided")

  job, _file = jobs[0]

  return CreateJobResponse(job_id=job.id)


@router.get("/source/{job_id}")
def download_source(
  job_id: str,
  job_service: JobService = Depends(get_job_service),
) -> FileResponse:
  """
  Stream the original uploaded audio for a given job.
  """
  job = job_service.get_job(job_id)
  if not job or job.tool != JobTool.NOXSONGIZER:
    raise HTTPException(status_code=404, detail="Job not found")
  if not job.input_path:
    raise HTTPException(status_code=404, detail="Original file not found")

  path = Path(job.input_path)
  if not path.exists() or not path.is_file():
    raise HTTPException(status_code=404, detail="Original file not found")

  media_type, _ = guess_type(path.name)
  return FileResponse(
    path=str(path),
    media_type=media_type or "application/octet-stream",
    filename=path.name,
  )


@router.get("/download/{job_id}/{stem_name}")
def download_stem(
  job_id: str,
  stem_name: str,
  job_service: JobService = Depends(get_job_service),
) -> FileResponse:
  """
  Download a generated stem file for the given job.
  """
  job = job_service.get_job(job_id)
  if not job or not job.output_path:
    raise HTTPException(status_code=404, detail="Job not found or not ready")

  path = Path(job.output_path) / stem_name
  if not path.exists():
    raise HTTPException(status_code=404, detail="Stem not found")

  return FileResponse(
    path=str(path),
    media_type="audio/wav",
    filename=stem_name,
  )
