"""Cleanup helpers for job-related filesystem artifacts."""

from __future__ import annotations

import shutil
from pathlib import Path

from app.jobs.model import Job


class JobCleanupService:
  """Handles best-effort cleanup of job-related filesystem artifacts."""

  def cleanup_job_files(
    self,
    job: Job,
    *,
    keep_input: bool = True,
  ) -> None:
    """
    Cleanup filesystem artifacts associated with a job.

    By default, input files are preserved to allow preview, debugging,
    and potential job re-runs.
    """
    if not keep_input and job.input_path:
      self._safe_remove(Path(job.input_path).parent)

    if job.output_path:
      self._safe_remove(Path(job.output_path))

  def _safe_remove(self, path: Path) -> None:
    """Best-effort directory removal without raising upstream errors."""
    try:
      if path.exists():
        if path.is_file():
          path.unlink()
        else:
          shutil.rmtree(path)
    except Exception:
      pass
