import asyncio

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import jobs, noxsongizer, noxelizer
from app.db import engine, init_db
from app.models.job import JobTool
from app.events.job_events import job_event_bus
from app.services.noxsongizer_service import NoxsongizerService
from app.workers.job_worker import JobWorker

app = FastAPI(title="Noxtools API")

# Autoriser le front localhost:5173
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
app.include_router(jobs.router)

job_worker = JobWorker(engine)
job_worker.register_executor(
  JobTool.NOXSONGIZER,
  lambda job, svc: NoxsongizerService(svc).process_job(job),
)


@app.on_event("startup")
def on_startup() -> None:
  init_db()
  job_event_bus.set_loop(asyncio.get_event_loop())
  job_worker.start()


@app.on_event("shutdown")
def on_shutdown() -> None:
  job_worker.stop()
