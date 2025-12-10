"""FastAPI routes for Noxelizer-specific operations."""

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
from app.services.noxelizer_service import NoxelizerService

router = APIRouter(prefix="/api/noxelizer", tags=["noxelizer"])


def get_job_service(session: Session = Depends(get_session)) -> JobService:
  """Dependency injector for JobService."""
  return JobService(session)


def get_noxelizer_service(job_service: JobService = Depends(get_job_service)) -> NoxelizerService:
  """Dependency injector for NoxelizerService."""
  return NoxelizerService(job_service)


class UploadItem(BaseModel):
  """Single upload job descriptor."""

  job_id: str
  filename: str


class UploadResponse(BaseModel):
  """Response containing created jobs for uploaded files."""

  jobs: List[UploadItem]


@router.get("/health")
def health() -> dict:
  """Health check for the Noxelizer tool."""
  return {"status": "ok", "service": "noxelizer"}


@router.post("/upload", response_model=UploadResponse)
async def upload_files(
  files: List[UploadFile] = File(...),
  service: NoxelizerService = Depends(get_noxelizer_service),
) -> UploadResponse:
  """
  Upload one or more image files and enqueue jobs for depixelization videos.
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
  """Stream the original uploaded image for a given job."""
  job = job_service.get_job(job_id)
  if not job or job.tool != JobTool.NOXELIZER:
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


@router.get("/download/{job_id}/{filename}")
def download_video(
  job_id: str,
  filename: str,
  job_service: JobService = Depends(get_job_service),
) -> FileResponse:
  """Download the generated video for a given job."""
  job = job_service.get_job(job_id)
  if not job or not job.output_path:
    raise HTTPException(status_code=404, detail="Job not found or not ready")

  path = Path(job.output_path) / filename
  if not path.exists():
    raise HTTPException(status_code=404, detail="File not found")

  return FileResponse(
    path=str(path),
    media_type="video/mp4",
    filename=filename,
  )
