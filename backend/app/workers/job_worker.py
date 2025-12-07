from __future__ import annotations

import threading
import time
from typing import Callable, Dict, Optional
from uuid import uuid4

from sqlmodel import Session, select

from app.models.job import Job, JobStatus, JobTool, _utcnow
from app.services.job_service import JobService

JobExecutor = Callable[[Job, JobService], None]


class JobWorker:
  """
  Background worker that pulls pending jobs and executes them sequentially.
  """

  def __init__(self, engine, *, poll_interval: float = 2.0) -> None:
    self.engine = engine
    self.poll_interval = poll_interval
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
      job = self._acquire_next_job()
      if not job:
        time.sleep(self.poll_interval)
        continue
      self._process_job(job.id)

  def _acquire_next_job(self) -> Optional[Job]:
    with Session(self.engine) as session:
      stmt = (
        select(Job)
        .where(Job.status == JobStatus.PENDING)
        .where(Job.locked_at.is_(None))
        .order_by(Job.created_at)
        .limit(1)
      )
      job = session.exec(stmt).first()
      if not job:
        return None

      session.exec(
        Job.__table__.update()
        .where(Job.id == job.id)
        .values(locked_at=_utcnow(), locked_by=self.worker_id)
      )
      session.commit()
      session.refresh(job)
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

      service.mark_running(job_id, worker_id=self.worker_id, attempt=(job.attempt or 0) + 1)

      try:
        executor(job, service)
      except Exception as exc:  # noqa: BLE001
        service.mark_error(job_id, str(exc))
        return
