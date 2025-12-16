"""Cleanup helpers for job-related filesystem artifacts."""

from __future__ import annotations

import shutil
from pathlib import Path

from app.models.job import Job


class JobCleanupService:
  """Handles best-effort cleanup of job-related filesystem artifacts."""

  def cleanup_job_files(
    self,
    job: Job,
    *,
    output_base: Path | None = None,
    keep_input: bool = True,
  ) -> None:
    """
    Cleanup filesystem artifacts associated with a job.

    By default, input files are preserved to allow preview, debugging,
    and potential job re-runs.

    Args:
      job: Job whose filesystem artifacts should be cleaned.
      output_base: Base output directory of the executor, required to
        cleanup output directories when output_path has not been persisted.
      keep_input: Whether to keep the job input files.
    """
    if not keep_input and job.input_path:
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
