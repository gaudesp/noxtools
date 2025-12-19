"""Background job worker for processing queued jobs."""

from __future__ import annotations

import threading
import time
from datetime import timedelta
from typing import Callable, Dict, Optional
from uuid import uuid4

from sqlmodel import Session, select

from app.errors import ExecutionError
from app.jobs.lifecycle import JobAbortReason, JobLifecycleService
from app.jobs.model import Job, JobStatus, JobTool, _utcnow
from app.jobs.schemas import JobExecutionResult
from app.jobs.service import JobService
from app.worker.cancellation import CancellationToken, JobCancelled


JobExecutor = Callable[[Job, JobService, CancellationToken], JobExecutionResult]


class JobWorker:
  """
  Pulls pending jobs FIFO, executes tool-specific executors, and updates status.

  Designed to be crash-resilient: all lifecycle steps are wrapped in defensive
  try/except blocks, and lock updates are always attempted to avoid stuck jobs.
  """

  def __init__(
    self,
    engine,
    *,
    poll_interval: float = 2.0,
    stale_lock_seconds: float = 300,
  ) -> None:
    self.engine = engine
    self.poll_interval = poll_interval
    self.stale_lock_seconds = stale_lock_seconds
    self.worker_id = str(uuid4())
    self.executors: Dict[JobTool, JobExecutor] = {}
    self._stop_event = threading.Event()
    self._thread: Optional[threading.Thread] = None
    self._tokens_lock = threading.Lock()
    self._active_tokens: Dict[str, CancellationToken] = {}

  def register_executor(self, tool: JobTool, executor: JobExecutor) -> None:
    self.executors[tool] = executor

  def start(self) -> None:
    if self._thread and self._thread.is_alive():
      return
    self._stop_event.clear()
    self._thread = threading.Thread(target=self._run_loop, daemon=True)
    self._thread.start()

  def stop(self, *, wait: bool = True, abort_running: bool = True) -> None:
    """
    Request worker shutdown, optionally aborting any in-flight jobs.

    Args:
      wait: Whether to wait briefly for the worker thread to exit.
      abort_running: Whether to cancel and mark running jobs as aborted.
    """
    self._stop_event.set()
    if abort_running:
      self._abort_inflight_jobs()
    if wait and self._thread:
      self._thread.join(timeout=2)

  def _run_loop(self) -> None:
    while not self._stop_event.is_set():
      try:
        job = self._acquire_next_job()
        if not job:
          time.sleep(self.poll_interval)
          continue
        self._process_job(job.id)
      except Exception:
        time.sleep(self.poll_interval)

  def _register_token(self, token: CancellationToken) -> None:
    """Track active cancellation tokens so shutdown can cancel in-flight jobs."""
    with self._tokens_lock:
      self._active_tokens[token.job_id] = token

  def _unregister_token(self, job_id: str) -> None:
    """Remove a token from the active registry."""
    with self._tokens_lock:
      self._active_tokens.pop(job_id, None)

  def _cancel_active_tokens(self) -> None:
    """Cancel all active tokens to cooperatively stop executors."""
    with self._tokens_lock:
      tokens = list(self._active_tokens.values())
    for token in tokens:
      token.cancel()

  def _abort_inflight_jobs(self) -> None:
    """
    Cancel active executors and mark running jobs as aborted for shutdown.
    """
    self._cancel_active_tokens()
    with Session(self.engine) as session:
      lifecycle = JobLifecycleService(session)
      lifecycle.abort_running_jobs(reason=JobAbortReason.SHUTDOWN)

  def _acquire_next_job(self) -> Optional[Job]:
    with Session(self.engine) as session:
      stale_before = _utcnow() - timedelta(seconds=self.stale_lock_seconds)
      stmt = (
        select(Job)
        .where(Job.status == JobStatus.PENDING)
        .where((Job.locked_at.is_(None)) | (Job.locked_at <= stale_before))
        .order_by(Job.created_at)
        .limit(1)
      )
      job = session.exec(stmt).first()
      if not job:
        return None

      try:
        session.exec(
          Job.__table__.update()
          .where(Job.id == job.id)
          .values(locked_at=_utcnow(), locked_by=self.worker_id)
        )
        session.commit()
        session.refresh(job)
      except Exception:
        session.rollback()
        return None

      return job

  def _process_job(self, job_id: str) -> None:
    with Session(self.engine) as session:
      lifecycle = JobLifecycleService(session)
      service = lifecycle.job_service
      job = service.get_job(job_id)
      if not job:
        return

      executor = self.executors.get(job.tool)
      if not executor:
        lifecycle.fail(job_id, f"No executor registered for tool '{job.tool}'")
        return

      cancel_token = CancellationToken(job_id)
      self._register_token(cancel_token)
      watcher = threading.Thread(
        target=self._watch_for_abort,
        args=(job_id, cancel_token),
        daemon=True,
      )
      watcher.start()

      if self._stop_event.is_set():
        cancel_token.cancel()

      updated = lifecycle.mark_running(
        job_id,
        worker_id=self.worker_id,
        attempt=(job.attempt or 0) + 1,
      )
      if not updated:
        cancel_token.stop()
        self._unregister_token(job_id)
        return

      if self._stop_event.is_set():
        cancel_token.cancel()

      try:
        result = executor(updated, service, cancel_token)
        if not isinstance(result, JobExecutionResult):
          raise ExecutionError("Executor returned an invalid result payload")
        lifecycle.complete(job_id, result)
      except JobCancelled:
        lifecycle.abort_for_cancellation(job_id, shutdown_requested=self._stop_event.is_set())
      except KeyboardInterrupt:
        lifecycle.abort_if_running(job_id, reason=JobAbortReason.SHUTDOWN)
      except Exception as exc:
        lifecycle.fail(job_id, str(exc))
      finally:
        cancel_token.stop()
        self._unregister_token(job_id)

      refreshed = service.get_job(job_id)
      if refreshed and refreshed.status == JobStatus.RUNNING:
        lifecycle.fail(job_id, "Executor completed without finalizing job status")

  def _watch_for_abort(self, job_id: str, token: CancellationToken) -> None:
    while not token.stopped:
      time.sleep(0.5)
      if token.stopped or token.cancelled:
        return

      with Session(self.engine) as session:
        job = session.get(Job, job_id)
        if job and job.status == JobStatus.ABORTED:
          token.cancel()
          return
