"""Shared base executor utilities for all tools."""

from __future__ import annotations

import subprocess
import time
from pathlib import Path
from typing import Iterable, Set

from app.models.job import Job
from app.workers.job_worker import CancellationToken, JobCancelled


class BaseExecutor:
  """
  Minimal base class for executors.

  Responsibilities:
  - input validation (presence + existence)
  - output directory preparation
  - subprocess execution with cooperative cancellation
  - filesystem helpers for non-deterministic outputs (snapshot / detect)
  """

  def __init__(self, *, base_output: Path) -> None:
    self.base_output = base_output
    self.base_output.mkdir(parents=True, exist_ok=True)

  def prepare_output_dir(self, job: Job) -> Path:
    """Create and return the per-job output directory."""
    output_dir = self.base_output / job.id
    output_dir.mkdir(parents=True, exist_ok=True)
    return output_dir

  def snapshot(self, directory: Path) -> Set[Path]:
    """Snapshot current files in a directory."""
    if not directory.exists():
      return set()
    return {p for p in directory.iterdir() if p.is_file()}

  def detect_new_file(
    self,
    directory: Path,
    before: Set[Path],
    label: str,
  ) -> Path:
    """
    Detect exactly one newly created file in a directory.

    Raises:
      RuntimeError if none or multiple files are found.
    """
    after = self.snapshot(directory)
    created = list(after - before)

    if not created:
      raise RuntimeError(f"No {label} file was created")
    if len(created) > 1:
      raise RuntimeError(f"Multiple {label} files were created")

    return created[0]
  
  def cleanup_directory(
    self,
    directory: Path,
    keep: Iterable[str],
  ) -> None:
    """
    Remove all files in directory except those explicitly kept.

    Used for tools with non-deterministic outputs (e.g. yt-dlp).
    """
    keep_set = set(keep)
    if not directory.exists():
      return

    for path in directory.iterdir():
      if not path.is_file():
        continue
      if path.name not in keep_set:
        try:
          path.unlink()
        except Exception:
          pass

  def ensure_input_file(self, job: Job) -> Path:
    """Ensure the job has a valid input file."""
    if not job.input_path:
      raise ValueError("Input file is missing")

    input_file = Path(job.input_path)
    if not input_file.exists():
      raise ValueError("Input file not found on disk")

    return input_file

  def run_process(
    self,
    cmd: list[str],
    *,
    cancel_token: CancellationToken | None = None,
  ) -> None:
    """Run a subprocess and raise on failure."""
    proc = subprocess.Popen(
      cmd,
      stdout=subprocess.PIPE,
      stderr=subprocess.PIPE,
      text=True,
    )

    try:
      retcode, _, stderr = self._wait_process(proc, cancel_token)
      if retcode != 0:
        raise RuntimeError((stderr or "").strip() or f"{cmd[0]} failed")
    finally:
      self._terminate_if_needed(proc, cancel_token)

  def run_capture(
    self,
    cmd: list[str],
    *,
    cancel_token: CancellationToken | None = None,
  ) -> subprocess.CompletedProcess[str]:
    """Run a subprocess and return captured output."""
    proc = subprocess.Popen(
      cmd,
      stdout=subprocess.PIPE,
      stderr=subprocess.PIPE,
      text=True,
    )

    try:
      retcode, stdout, stderr = self._wait_process(proc, cancel_token)
      return subprocess.CompletedProcess(cmd, retcode, stdout, stderr)
    finally:
      self._terminate_if_needed(proc, cancel_token)

  def _wait_process(
    self,
    proc: subprocess.Popen,
    cancel_token: CancellationToken | None,
  ) -> tuple[int, str, str]:
    stdout = ""
    stderr = ""

    while True:
      if cancel_token and cancel_token.cancelled:
        proc.terminate()
        try:
          proc.wait(timeout=5)
        except Exception:
          proc.kill()
        raise JobCancelled()

      try:
        out, err = proc.communicate(timeout=0.5)
        stdout += out or ""
        stderr += err or ""
        return proc.returncode or 0, stdout, stderr
      except subprocess.TimeoutExpired:
        time.sleep(0.1)

  def _terminate_if_needed(
    self,
    proc: subprocess.Popen,
    cancel_token: CancellationToken | None,
  ) -> None:
    if cancel_token and cancel_token.stopped and proc.poll() is None:
      try:
        proc.terminate()
      except Exception:
        pass
