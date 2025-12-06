import shutil
import subprocess
import threading
from pathlib import Path
from fastapi import UploadFile


class NoxsongizerService:
  BASE_UPLOAD = Path("media/uploads")
  BASE_OUTPUT = Path("media/outputs")

  jobs = {}  # simple in-memory job registry

  def __init__(self):
    self.BASE_UPLOAD.mkdir(parents=True, exist_ok=True)
    self.BASE_OUTPUT.mkdir(parents=True, exist_ok=True)

  # -----------------------------
  # Save uploaded file
  # -----------------------------
  def save_uploaded_file(self, job_id: str, file: UploadFile):
    upload_dir = self.BASE_UPLOAD / job_id
    upload_dir.mkdir(parents=True, exist_ok=True)

    dest = upload_dir / file.filename

    with dest.open("wb") as buffer:
      shutil.copyfileobj(file.file, buffer)

    # initialize job
    self.jobs[job_id] = {
      "status": "pending",
      "filename": file.filename
    }

    # start demucs thread automatically
    thread = threading.Thread(
      target=self._run_demucs_job,
      args=(job_id, dest),
      daemon=True
    )
    thread.start()

  # -----------------------------
  # Run Demucs job in background
  # -----------------------------
  def _run_demucs_job(self, job_id: str, input_file: Path):
    try:
      self.jobs[job_id]["status"] = "processing"

      output_dir = self.BASE_OUTPUT / job_id
      output_dir.mkdir(parents=True, exist_ok=True)

      # Run Demucs
      cmd = [
        "demucs",
        "-n", "htdemucs_ft",
        str(input_file)
      ]

      process = subprocess.run(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
      )

      # If Demucs failed
      if process.returncode != 0:
        self.jobs[job_id]["status"] = "error"
        self.jobs[job_id]["error"] = process.stderr
        return

      # Move stems
      demucs_output_folder = self._find_demucs_output_folder(input_file)
      if not demucs_output_folder:
        self.jobs[job_id]["status"] = "error"
        self.jobs[job_id]["error"] = "Demucs output folder not found"
        return

      for stem in demucs_output_folder.iterdir():
        shutil.move(str(stem), str(output_dir / stem.name))

      self.jobs[job_id]["status"] = "done"

    except Exception as e:
      self.jobs[job_id]["status"] = "error"
      self.jobs[job_id]["error"] = str(e)

  # -----------------------------
  # Locate Demucs' output folder
  # -----------------------------
  def _find_demucs_output_folder(self, input_file: Path) -> Path | None:
    demucs_base = Path("separated/htdemucs_ft")
    if not demucs_base.exists():
      return None

    # Demucs outputs: separated/htdemucs_ft/<filename>/
    folder_name = input_file.stem
    folder = demucs_base / folder_name

    if folder.exists():
      return folder

    # Sometimes Demucs adds suffixes — list possible dirs
    matches = list(demucs_base.glob(f"{folder_name}*"))
    return matches[0] if matches else None

  # -----------------------------
  # Job status
  # -----------------------------
  def get_job_status(self, job_id: str) -> str:
    job = self.jobs.get(job_id)
    if not job:
      return "unknown"

    if job["status"] == "error":
      print("\n=== DEMUCS ERROR ===")
      print(job.get("error"))
      print("====================\n")

    return job["status"]

  # -----------------------------
  # Stem download
  # -----------------------------
  def get_stem_path(self, job_id: str, stem: str) -> Path:
    return (self.BASE_OUTPUT / job_id / stem)
