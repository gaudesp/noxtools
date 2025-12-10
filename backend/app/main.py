"""Application entrypoint wiring FastAPI routes, worker, and executors."""

import asyncio

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import jobs, noxsongizer, noxelizer, noxtubizer
from app.db import engine, init_db
from app.events.job_events import job_event_bus
from app.models.job import JobTool
from app.services.noxsongizer_service import NoxsongizerService
from app.services.noxelizer_service import NoxelizerService
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
app.include_router(jobs.router)

job_worker = JobWorker(engine)
job_worker.register_executor(
  JobTool.NOXSONGIZER,
  lambda job, svc: NoxsongizerService(svc).process_job(job),
)
job_worker.register_executor(
  JobTool.NOXELIZER,
  lambda job, svc: NoxelizerService(svc).process_job(job),
)
job_worker.register_executor(
  JobTool.NOXTUBIZER,
  lambda job, svc: NoxtubizerService(svc).process_job(job),
)


@app.on_event("startup")
def on_startup() -> None:
  """Initialize database, event loop binding, and start worker."""
  init_db()
  job_event_bus.set_loop(asyncio.get_event_loop())
  job_worker.start()


@app.on_event("shutdown")
def on_shutdown() -> None:
  """Stop background worker on application shutdown."""
  job_worker.stop()
