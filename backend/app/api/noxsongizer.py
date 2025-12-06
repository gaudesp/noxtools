from fastapi import APIRouter, UploadFile, File, HTTPException
from uuid import uuid4
from fastapi.responses import FileResponse
from app.services.noxsongizer_service import NoxsongizerService

router = APIRouter(prefix="/api/noxsongizer", tags=["noxsongizer"])
service = NoxsongizerService()

@router.get("/health")
def health() -> dict:
  return {"status": "ok", "service": "noxsongizer"}

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
  job_id = str(uuid4())

  try:
    service.save_uploaded_file(job_id, file)
  except Exception as e:
    raise HTTPException(status_code=500, detail=f"Upload failed: {e}")

  return {"job_id": job_id, "filename": file.filename}

@router.get("/status/{job_id}")
async def get_status(job_id: str):
  status = service.get_job_status(job_id)
  return {"job_id": job_id, "status": status}

@router.get("/download/{job_id}/{stem}")
async def download_stem(job_id: str, stem: str):
  file = service.get_stem_path(job_id, stem)
  if not file.exists():
      raise HTTPException(status_code=404, detail="Stem not available yet")
  return FileResponse(file)
