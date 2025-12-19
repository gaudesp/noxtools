"""Cancellation primitives for cooperative job execution."""

from __future__ import annotations

import threading


class JobCancelled(Exception):
  """Raised when a job is aborted during execution."""


class CancellationToken:
  """Cooperative cancellation token shared between worker and executor."""

  def __init__(self, job_id: str) -> None:
    self.job_id = job_id
    self._cancelled = threading.Event()
    self._stop = threading.Event()

  def cancel(self) -> None:
    """Trigger cancellation."""
    self._cancelled.set()

  def stop(self) -> None:
    """Stop monitoring without cancelling."""
    self._stop.set()

  @property
  def cancelled(self) -> bool:
    return self._cancelled.is_set()

  @property
  def stopped(self) -> bool:
    return self._stop.is_set()

  def raise_if_cancelled(self) -> None:
    """Raise if cancellation was requested."""
    if self._cancelled.is_set():
      raise JobCancelled()
