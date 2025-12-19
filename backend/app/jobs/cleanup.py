"""Cleanup helpers for job-related filesystem artifacts."""

from __future__ import annotations

import shutil
from pathlib import Path

from app.jobs.model import Job, JobTool
from app.utils.paths import output_base as tool_output_base


class JobCleanupService:
  """Handles best-effort cleanup of job-related filesystem artifacts."""

  def cleanup_job_files(
    self,
    job: Job,
    *,
    output_root: Path | None = None,
    keep_input: bool = True,
  ) -> None:
    """
    Cleanup filesystem artifacts associated with a job.

    By default, input files are preserved to allow preview, debugging,
    and potential job re-runs.
    """
    resolved_output_base = output_root or self._default_output_base(job)

    if not keep_input and job.input_path:
      self._safe_remove(Path(job.input_path).parent)

    if job.output_path:
      self._safe_remove(Path(job.output_path))
    elif resolved_output_base:
      self._safe_remove(resolved_output_base / job.id)

  def _safe_remove(self, path: Path) -> None:
    """Best-effort directory removal without raising upstream errors."""
    try:
      if path.exists():
        shutil.rmtree(path)
    except Exception:
      pass

  def _default_output_base(self, job: Job) -> Path | None:
    """Infer the default output directory base for a job's tool."""
    return tool_output_base(job.tool)
