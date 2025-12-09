"""Cleanup helpers for job-related filesystem artifacts."""

from __future__ import annotations

import shutil
from pathlib import Path

from app.models.job import Job


class JobCleanupService:
  """Handles cleanup of job-related files (input/output directories)."""

  def cleanup_job_files(self, job: Job) -> None:
    """
    Remove per-job input and output directories where they exist.

    Args:
      job: Job whose files should be removed.
    """
    if job.input_path:
      self._safe_remove(Path(job.input_path).parent)
    if job.output_path:
      self._safe_remove(Path(job.output_path))

  def _safe_remove(self, path: Path) -> None:
    """
    Best-effort directory removal without raising upstream errors.

    Args:
      path: Directory path to remove.
    """
    try:
      if path.exists():
        shutil.rmtree(path)
    except Exception:
      pass
