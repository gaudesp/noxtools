from pathlib import Path
from fastapi import UploadFile
import shutil

class NoxsongizerService:
  BASE_UPLOAD = Path("media/uploads")
  BASE_OUTPUT = Path("media/outputs")

  jobs = {}  # TEMPORARY IN-MEMORY JOB STORAGE

  def __init__(self):
    self.BASE_UPLOAD.mkdir(parents=True, exist_ok=True)
    self.BASE_OUTPUT.mkdir(parents=True, exist_ok=True)

  # -----------------------------
  # Save uploaded file
  # -----------------------------
  def save_uploaded_file(self, job_id: str, file: UploadFile):
    job_folder = self.BASE_UPLOAD / job_id
    job_folder.mkdir(parents=True, exist_ok=True)

    dest = job_folder / file.filename

    with dest.open("wb") as buffer:
      shutil.copyfileobj(file.file, buffer)

    # Initialize job
    self.jobs[job_id] = {"status": "pending"}

  # -----------------------------
  # Get job status
  # -----------------------------
  def get_job_status(self, job_id: str) -> str:
    job = self.jobs.get(job_id)
    if not job:
      return "unknown"
    return job["status"]

  # -----------------------------
  # Stub for stem download
  # -----------------------------
  def get_stem_path(self, job_id: str, stem: str) -> Path:
    return self.BASE_OUTPUT / job_id / stem
