from __future__ import annotations

from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlmodel import Session

from app.db import get_session
from app.services.job_service import JobService
from app.services.noxsongizer_service import NoxsongizerService

router = APIRouter(prefix="/api/noxsongizer", tags=["noxsongizer"])


def get_job_service(session: Session = Depends(get_session)) -> JobService:
  return JobService(session)


def get_noxsongizer_service(job_service: JobService = Depends(get_job_service)) -> NoxsongizerService:
  return NoxsongizerService(job_service)


class UploadResponse(BaseModel):
  job_id: str
  filename: str


class StatusResponse(BaseModel):
  job_id: str
  status: str
  stems: List[str] = []
  error: Optional[str] = None


@router.get("/health")
def health() -> dict:
  return {"status": "ok", "service": "noxsongizer"}


@router.post("/upload", response_model=UploadResponse)
async def upload_file(
  file: UploadFile = File(...),
  service: NoxsongizerService = Depends(get_noxsongizer_service),
) -> UploadResponse:
  job = service.create_job_from_upload(file)
  return UploadResponse(job_id=job.id, filename=file.filename)


@router.get("/status/{job_id}", response_model=StatusResponse)
def get_status(
  job_id: str,
  job_service: JobService = Depends(get_job_service),
) -> StatusResponse:
  job = job_service.get_job(job_id)
  if not job:
    raise HTTPException(status_code=404, detail="Job not found")

  stems = job.output_files or (job.result.get("stems") if job.result else [])

  return StatusResponse(
    job_id=job_id,
    status=str(job.status.value),
    stems=list(stems),
    error=job.error_message,
  )


@router.get("/download/{job_id}/{stem_name}")
def download_stem(
  job_id: str,
  stem_name: str,
  job_service: JobService = Depends(get_job_service),
) -> FileResponse:
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
