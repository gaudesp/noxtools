"""FastAPI routes for Noxtubizer operations."""

from __future__ import annotations

from mimetypes import guess_type
from pathlib import Path
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel, HttpUrl
from sqlmodel import Session

from app.db import get_session
from app.models.job import JobTool
from app.services.job_service import JobService
from app.services.noxtubizer_service import NoxtubizerJobRequest, NoxtubizerService

router = APIRouter(prefix="/api/noxtubizer", tags=["noxtubizer"])


def get_job_service(session: Session = Depends(get_session)) -> JobService:
  """Dependency injector for JobService."""
  return JobService(session)


def get_noxtubizer_service(job_service: JobService = Depends(get_job_service)) -> NoxtubizerService:
  """Dependency injector for NoxtubizerService."""
  return NoxtubizerService(job_service)


class CreateJobPayload(BaseModel):
  """Request payload for queuing a Noxtubizer job."""

  url: HttpUrl
  mode: Literal["audio", "video", "both"]
  audio_quality: Literal["high", "320kbps", "256kbps", "128kbps", "64kbps"] | None = None
  audio_format: Literal["mp3", "m4a", "ogg", "wav"] | None = None
  video_quality: Literal["best", "4320p", "2160p", "1440p", "1080p", "720p", "480p", "360p", "240p"] | None = None
  video_format: Literal["mp4", "mkv"] | None = None


class CreateJobResponse(BaseModel):
  """Response envelope for a newly created job."""

  job_id: str


@router.get("/health")
def health() -> dict:
  """Health check for the Noxtubizer tool."""
  return {"status": "ok", "service": "noxtubizer"}


@router.post("/jobs", response_model=CreateJobResponse)
def create_job(
  payload: CreateJobPayload,
  service: NoxtubizerService = Depends(get_noxtubizer_service),
) -> CreateJobResponse:
  """
  Queue a new Noxtubizer job for the provided YouTube URL.
  """
  try:
    job = service.create_job(NoxtubizerJobRequest(**payload.model_dump()))
  except ValueError as exc:
    raise HTTPException(status_code=400, detail=str(exc))
  return CreateJobResponse(job_id=job.id)


@router.get("/download/{job_id}/{filename}")
def download_output(
  job_id: str,
  filename: str,
  job_service: JobService = Depends(get_job_service),
) -> FileResponse:
  """
  Download an output artifact for a Noxtubizer job.
  """
  job = job_service.get_job(job_id)
  if not job or job.tool != JobTool.NOXTUBIZER:
    raise HTTPException(status_code=404, detail="Job not found")

  if not job.output_path:
    raise HTTPException(status_code=404, detail="Job outputs are not ready")

  path = Path(job.output_path) / filename
  if not path.exists():
    raise HTTPException(status_code=404, detail="Requested file does not exist")

  media_type, _ = guess_type(path.name)
  return FileResponse(
    path=str(path),
    media_type=media_type or "application/octet-stream",
    filename=path.name,
  )
