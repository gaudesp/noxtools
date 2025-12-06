from __future__ import annotations

import shutil
import subprocess
import threading
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import UploadFile


class NoxsongizerService:
  BASE_UPLOAD = Path("media/uploads")
  BASE_OUTPUT = Path("media/outputs")

  # Very simple in-memory job registry
  jobs: Dict[str, Dict[str, Any]] = {}

  def __init__(self) -> None:
    self.BASE_UPLOAD.mkdir(parents=True, exist_ok=True)
    self.BASE_OUTPUT.mkdir(parents=True, exist_ok=True)

  # -----------------------------
  # Public API
  # -----------------------------
  def save_uploaded_file(self, job_id: str, file: UploadFile) -> None:
    upload_dir = self.BASE_UPLOAD / job_id
    upload_dir.mkdir(parents=True, exist_ok=True)

    dest = upload_dir / file.filename

    with dest.open("wb") as buffer:
      shutil.copyfileobj(file.file, buffer)

    # init job
    self.jobs[job_id] = {
      "status": "pending",
      "filename": file.filename,
      "stems": [],
      "error": None,
    }

    # start Demucs in background
    thread = threading.Thread(
      target=self._run_demucs_job,
      args=(job_id, dest),
      daemon=True,
    )
    thread.start()

  def get_job(self, job_id: str) -> Optional[Dict[str, Any]]:
    return self.jobs.get(job_id)

  def get_stem_path(self, job_id: str, stem: str) -> Path:
    return self.BASE_OUTPUT / job_id / stem

  # -----------------------------
  # Internal helpers
  # -----------------------------
  def _run_demucs_job(self, job_id: str, input_file: Path) -> None:
    try:
      job = self.jobs.get(job_id)
      if not job:
        return

      job["status"] = "processing"

      output_dir = self.BASE_OUTPUT / job_id
      output_dir.mkdir(parents=True, exist_ok=True)

      cmd = [
        "demucs",
        "-n",
        "htdemucs_ft",
        str(input_file),
      ]

      process = subprocess.run(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
      )

      if process.returncode != 0:
        job["status"] = "error"
        job["error"] = process.stderr
        return

      demucs_output_folder = self._find_demucs_output_folder(input_file)
      if not demucs_output_folder:
        job["status"] = "error"
        job["error"] = "Demucs output folder not found."
        return

      stems: List[str] = []

      for stem_path in demucs_output_folder.iterdir():
        if stem_path.is_file():
          target = output_dir / stem_path.name
          shutil.move(str(stem_path), str(target))
          stems.append(stem_path.name)

      # optional cleanup of Demucs temp folder
      try:
        shutil.rmtree(demucs_output_folder)
      except OSError:
        pass

      job["stems"] = stems
      job["status"] = "done"

    except Exception as exc:  # noqa: BLE001
      job = self.jobs.get(job_id)
      if job is not None:
        job["status"] = "error"
        job["error"] = str(exc)

  def _find_demucs_output_folder(self, input_file: Path) -> Optional[Path]:
    """
    Demucs usually outputs to separated/htdemucs_ft/<file_stem>/
    """
    demucs_base = Path("separated/htdemucs_ft")
    if not demucs_base.exists():
      return None

    stem_name = input_file.stem
    candidate = demucs_base / stem_name
    if candidate.exists():
      return candidate

    matches = list(demucs_base.glob(f"{stem_name}*"))
    if matches:
      return matches[0]

    return None
