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

JobExecutor = Callable[[Job, JobService], None]

class JobWorker:
  """
  Pulls pending jobs FIFO, executes tool-specific executors, and updates status.

  Designed to be crash-resilient: all lifecycle steps are wrapped in defensive
  try/except blocks, and lock updates are always attempted to avoid stuck jobs.
  """

  def __init__(self, engine, *, poll_interval: float = 2.0, stale_lock_seconds: float = 300) -> None:
    """
    Create a job worker.

    Args:
      engine: SQLModel engine for session creation.
      poll_interval: Seconds to wait between polling cycles.
      stale_lock_seconds: Lock age threshold to consider a job stale and retryable.
    """
    self.engine = engine
    self.poll_interval = poll_interval
    self.stale_lock_seconds = stale_lock_seconds
    self.worker_id = str(uuid4())
    self.executors: Dict[JobTool, JobExecutor] = {}
    self._stop_event = threading.Event()
    self._thread: Optional[threading.Thread] = None

  def register_executor(self, tool: JobTool, executor: JobExecutor) -> None:
    """Associate a tool with its execution function."""
    self.executors[tool] = executor

  def start(self) -> None:
    """Launch the worker loop in a daemon thread."""
    if self._thread and self._thread.is_alive():
      return
    self._stop_event.clear()
    self._thread = threading.Thread(target=self._run_loop, daemon=True)
    self._thread.start()

  def stop(self) -> None:
    """Signal the worker loop to halt and wait briefly for shutdown."""
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
    """
    Fetch the next available job and place a lock on it.

    Returns:
      The locked job, or None if none available.
    """
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
    """Run a single job through its executor with guarded lifecycle transitions."""
    with Session(self.engine) as session:
      service = JobService(session)
      job = service.get_job(job_id)
      if not job:
        return

      executor = self.executors.get(job.tool)
      if not executor:
        service.mark_error(job_id, f"No executor registered for tool '{job.tool}'")
        return

      updated = service.mark_running(job_id, worker_id=self.worker_id, attempt=(job.attempt or 0) + 1)
      if not updated:
        return

      try:
        executor(updated, service)
      except Exception as exc:
        try:
          service.mark_error(job_id, str(exc))
        except Exception:
          self._force_unlock(service, job_id)
        return

      refreshed = service.get_job(job_id)
      if refreshed and refreshed.status == JobStatus.RUNNING:
        try:
          service.mark_error(job_id, "Executor completed without finalizing job status")
        except Exception:
          self._force_unlock(service, job_id)

  def _force_unlock(self, service: JobService, job_id: str) -> None:
    """
    Best-effort unlock to prevent stuck jobs when regular updates fail.

    Args:
      service: JobService instance bound to an active session.
      job_id: Identifier of the job to unlock.
    """
    try:
      service.update_job(job_id, JobUpdate(locked_at=None, locked_by=None, status=JobStatus.ERROR))
    except Exception:
      pass
