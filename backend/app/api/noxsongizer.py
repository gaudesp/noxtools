from __future__ import annotations

from pathlib import Path
from typing import List, Optional
from uuid import uuid4

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel

from app.services.noxsongizer_service import NoxsongizerService

router = APIRouter(prefix="/api/noxsongizer", tags=["noxsongizer"])

service = NoxsongizerService()


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
async def upload_file(file: UploadFile = File(...)) -> UploadResponse:
  job_id = str(uuid4())
  service.save_uploaded_file(job_id, file)
  return UploadResponse(job_id=job_id, filename=file.filename)


@router.get("/status/{job_id}", response_model=StatusResponse)
def get_status(job_id: str) -> StatusResponse:
  job = service.get_job(job_id)
  if not job:
    raise HTTPException(status_code=404, detail="Job not found")

  return StatusResponse(
    job_id=job_id,
    status=str(job.get("status", "unknown")),
    stems=list(job.get("stems", [])),
    error=job.get("error"),
  )


@router.get("/download/{job_id}/{stem_name}")
def download_stem(job_id: str, stem_name: str) -> FileResponse:
  path: Path = service.get_stem_path(job_id, stem_name)

  if not path.exists():
    raise HTTPException(status_code=404, detail="Stem not found")

  return FileResponse(
    path=str(path),
    media_type="audio/wav",
    filename=stem_name,
  )
