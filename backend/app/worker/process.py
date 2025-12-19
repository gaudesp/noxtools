"""Subprocess helpers with cooperative cancellation."""

from __future__ import annotations

import subprocess
import time

from app.errors import ExecutionError
from app.worker.cancellation import CancellationToken, JobCancelled


def run_process(
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
    retcode, _, stderr = _wait_process(proc, cancel_token)
    if retcode != 0:
      raise ExecutionError((stderr or "").strip() or f"{cmd[0]} failed")
  finally:
    _terminate_if_needed(proc, cancel_token)


def run_capture(
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
    retcode, stdout, stderr = _wait_process(proc, cancel_token)
    return subprocess.CompletedProcess(cmd, retcode, stdout, stderr)
  finally:
    _terminate_if_needed(proc, cancel_token)


def _wait_process(
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
  proc: subprocess.Popen,
  cancel_token: CancellationToken | None,
) -> None:
  if cancel_token and cancel_token.stopped and proc.poll() is None:
    try:
      proc.terminate()
    except Exception:
      pass
