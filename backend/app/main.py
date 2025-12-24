"""Application entrypoint wiring FastAPI routes, worker, and executors."""

import asyncio

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.db import engine, get_session, init_db
from app.errors import AppError
from app.files import router as files_router
from app.jobs import router as jobs_router
from app.jobs.events import job_event_bus
from app.jobs.lifecycle import JobAbortReason, JobLifecycleService
from app.jobs.model import JobTool
from app.tools.noxelizer.executor import NoxelizerExecutor
from app.tools.noxelizer import router as noxelizer_router
from app.tools.noxsongizer.executor import NoxsongizerExecutor
from app.tools.noxsongizer import router as noxsongizer_router
from app.tools.noxtubizer.executor import NoxtubizerExecutor
from app.tools.noxtubizer import router as noxtubizer_router
from app.tools.noxtunizer.executor import NoxtunizerExecutor
from app.tools.noxtunizer import router as noxtunizer_router
from app.worker import JobWorker

app = FastAPI(title="Noxtools API")


@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError):
  """Convert domain errors into JSON HTTP responses."""
  return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})

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

app.include_router(noxsongizer_router.router)
app.include_router(noxelizer_router.router)
app.include_router(noxtubizer_router.router)
app.include_router(noxtunizer_router.router)
app.include_router(files_router.router)
app.include_router(jobs_router.router)

job_worker = JobWorker(engine)

_noxsongizer_executor = NoxsongizerExecutor()
_noxelizer_executor = NoxelizerExecutor()
_noxtubizer_executor = NoxtubizerExecutor()
_noxtunizer_executor = NoxtunizerExecutor()

job_worker.register_executor(
  JobTool.NOXSONGIZER,
  lambda job, svc, token: _noxsongizer_executor.execute(job, cancel_token=token),
)
job_worker.register_executor(
  JobTool.NOXELIZER,
  lambda job, svc, token: _noxelizer_executor.execute(job, cancel_token=token),
)
job_worker.register_executor(
  JobTool.NOXTUBIZER,
  lambda job, svc, token: _noxtubizer_executor.execute(job, cancel_token=token),
)
job_worker.register_executor(
  JobTool.NOXTUNIZER,
  lambda job, svc, token: _noxtunizer_executor.execute(job, cancel_token=token),
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
