from __future__ import annotations

import shutil
from pathlib import Path

from app.models.job import Job


class JobCleanupService:
  """
  Handles cleanup of job-related files (input/output directories).
  """

  def cleanup_job_files(self, job: Job) -> None:
    if job.input_path:
      self._safe_remove(Path(job.input_path).parent)
    if job.output_path:
      self._safe_remove(Path(job.output_path))

  def _safe_remove(self, path: Path) -> None:
    try:
      if path.exists():
        shutil.rmtree(path)
    except Exception:
      # Swallow exceptions to avoid blocking deletion; logging could be added here.
      pass
