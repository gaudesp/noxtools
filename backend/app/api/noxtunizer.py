"""FastAPI routes for Noxtunizer-specific operations."""

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
from app.services.noxtunizer_service import NoxtunizerService

router = APIRouter(prefix="/api/noxtunizer", tags=["noxtunizer"])


def get_job_service(session: Session = Depends(get_session)) -> JobService:
  """Dependency injector for JobService."""
  return JobService(session)


def get_noxtunizer_service(job_service: JobService = Depends(get_job_service)) -> NoxtunizerService:
  """Dependency injector for NoxtunizerService."""
  return NoxtunizerService(job_service)


class UploadItem(BaseModel):
  """Single upload job descriptor."""

  job_id: str
  filename: str


class UploadResponse(BaseModel):
  """Response containing created jobs for uploaded files."""

  jobs: List[UploadItem]


@router.get("/health")
def health() -> dict:
  """Health check for the Noxtunizer tool."""
  return {"status": "ok", "service": "noxtunizer"}


@router.post("/upload", response_model=UploadResponse)
async def upload_files(
  files: List[UploadFile] = File(...),
  service: NoxtunizerService = Depends(get_noxtunizer_service),
) -> UploadResponse:
  """
  Upload one or more audio files and enqueue jobs for analysis.
  """
  jobs = service.create_jobs_from_uploads(files)
  return UploadResponse(
    jobs=[UploadItem(job_id=job.id, filename=file.filename) for job, file in jobs],
  )


@router.get("/source/{job_id}")
def download_source(
  job_id: str,
  job_service: JobService = Depends(get_job_service),
) -> FileResponse:
  """
  Stream the original uploaded audio for a given job.
  """
  job = job_service.get_job(job_id)
  if not job or job.tool != JobTool.NOXTUNIZER:
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
