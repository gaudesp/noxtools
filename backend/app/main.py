"""Application entrypoint wiring FastAPI routes, worker, and executors."""

import asyncio

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import jobs, noxsongizer, noxelizer, noxtubizer, noxtunizer
from app.db import engine, init_db, get_session
from app.events.job_events import job_event_bus
from app.models.job import JobTool
from app.services.job_lifecycle_service import JobAbortReason, JobLifecycleService
from app.services.noxsongizer_service import NoxsongizerService
from app.services.noxelizer_service import NoxelizerService
from app.services.noxtunizer_service import NoxtunizerService
from app.services.noxtubizer_service import NoxtubizerService
from app.workers.job_worker import JobWorker

app = FastAPI(title="Noxtools API")

origins = [
  "http://localhost:5173",
]

app.add_middleware(
  CORSMiddleware,
  allow_origins=origins,
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)

app.include_router(noxsongizer.router)
app.include_router(noxelizer.router)
app.include_router(noxtubizer.router)
app.include_router(noxtunizer.router)
app.include_router(jobs.router)

job_worker = JobWorker(engine)
job_worker.register_executor(
  JobTool.NOXSONGIZER,
  lambda job, svc, token: NoxsongizerService(svc).process_job(job, token),
)
job_worker.register_executor(
  JobTool.NOXELIZER,
  lambda job, svc, token: NoxelizerService(svc).process_job(job, token),
)
job_worker.register_executor(
  JobTool.NOXTUBIZER,
  lambda job, svc, token: NoxtubizerService(svc).process_job(job, token),
)
job_worker.register_executor(
  JobTool.NOXTUNIZER,
  lambda job, svc, token: NoxtunizerService(svc).process_job(job, token),
)


@app.on_event("startup")
def on_startup() -> None:
  """
  Initialize database, recover orphan jobs, bind event loop, and start worker.
  """
  init_db()

  session_gen = get_session()
  session = next(session_gen)
  try:
    JobLifecycleService(session).recover_running_jobs()
  finally:
    session.close()

  job_event_bus.set_loop(asyncio.get_event_loop())
  job_worker.start()


@app.on_event("shutdown")
def on_shutdown() -> None:
  """Stop background worker on application shutdown."""
  session_gen = get_session()
  session = next(session_gen)
  try:
    JobLifecycleService(session).abort_running_jobs(
      reason=JobAbortReason.SHUTDOWN,
    )
  finally:
    session.close()

  job_worker.stop(wait=False, abort_running=False)
