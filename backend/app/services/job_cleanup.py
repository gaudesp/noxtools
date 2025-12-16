"""Cleanup helpers for job-related filesystem artifacts."""

from __future__ import annotations

import shutil
from pathlib import Path

from app.models.job import Job


class JobCleanupService:
  """Handles best-effort cleanup of job-related filesystem artifacts."""

  def cleanup_job_files(self, job: Job, *, output_base: Path | None = None) -> None:
    """
    Remove filesystem artifacts associated with a job.

    This method cleans up:
    - the per-job input directory (uploads/<job_id>) if input_path is set
    - the per-job output directory in two cases:
        - if output_path is set (job completed successfully)
        - if output_path is not set but output_base is provided
          (job failed after output directory creation)

    Args:
      job: Job whose filesystem artifacts should be removed.
      output_base: Base output directory of the executor (e.g. media/<tool>/outputs),
                   required to cleanup output directories for failed jobs.
    """
    if job.input_path:
      self._safe_remove(Path(job.input_path).parent)

    if job.output_path:
      self._safe_remove(Path(job.output_path))
    elif output_base:
      self._safe_remove(output_base / job.id)

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
