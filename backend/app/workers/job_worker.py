"""Background job worker for processing queued jobs."""

from __future__ import annotations

import threading
import time
from datetime import timedelta
from typing import Callable, Dict, Optional
from uuid import uuid4

from sqlmodel import Session, select

from app.models.job import Job, JobStatus, JobTool, JobUpdate, _utcnow
from app.services.job_service import JobService


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


JobExecutor = Callable[[Job, JobService, CancellationToken], None]


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

  def register_executor(self, tool: JobTool, executor: JobExecutor) -> None:
    self.executors[tool] = executor

  def start(self) -> None:
    if self._thread and self._thread.is_alive():
      return
    self._stop_event.clear()
    self._thread = threading.Thread(target=self._run_loop, daemon=True)
    self._thread.start()

  def stop(self) -> None:
    self._stop_event.set()
    if self._thread:
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
      service = JobService(session)
      job = service.get_job(job_id)
      if not job:
        return

      executor = self.executors.get(job.tool)
      if not executor:
        service.mark_error(job_id, f"No executor registered for tool '{job.tool}'")
        return

      cancel_token = CancellationToken(job_id)
      watcher = threading.Thread(
        target=self._watch_for_abort,
        args=(job_id, cancel_token),
        daemon=True,
      )
      watcher.start()

      updated = service.mark_running(
        job_id,
        worker_id=self.worker_id,
        attempt=(job.attempt or 0) + 1,
      )
      if not updated:
        cancel_token.stop()
        return

      try:
        executor(updated, service, cancel_token)

      except JobCancelled:
        cancel_token.stop()
        aborted = service.update_job(
          job_id,
          JobUpdate(
            status=JobStatus.ABORTED,
            locked_at=None,
            locked_by=None,
          ),
        )
        if aborted:
          try:
            from app.services.job_cleanup import JobCleanupService

            JobCleanupService().cleanup_job_files(aborted, keep_input=True)
          except Exception:
            pass
        return

      except Exception as exc:
        cancel_token.stop()
        try:
          service.mark_error(job_id, str(exc))
        except Exception:
          self._force_unlock(service, job_id)
        return

      finally:
        cancel_token.stop()

      refreshed = service.get_job(job_id)
      if refreshed and refreshed.status == JobStatus.RUNNING:
        if cancel_token.cancelled:
          aborted = service.update_job(
            job_id,
            JobUpdate(
              status=JobStatus.ABORTED,
              locked_at=None,
              locked_by=None,
            ),
          )
          if aborted:
            try:
              from app.services.job_cleanup import JobCleanupService

              JobCleanupService().cleanup_job_files(aborted, keep_input=True)
            except Exception:
              pass
        else:
          try:
            service.mark_error(
              job_id,
              "Executor completed without finalizing job status",
            )
          except Exception:
            self._force_unlock(service, job_id)

  def _force_unlock(self, service: JobService, job_id: str) -> None:
    try:
      service.update_job(
        job_id,
        JobUpdate(
          status=JobStatus.ERROR,
          locked_at=None,
          locked_by=None,
        ),
      )
    except Exception:
      pass

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
