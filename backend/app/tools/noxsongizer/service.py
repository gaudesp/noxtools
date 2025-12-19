"""Tool service for creating Noxsongizer jobs."""

from __future__ import annotations

from pathlib import Path
from uuid import uuid4

from app.errors import NotFoundError
from app.jobs.model import Job, JobTool
from app.jobs.service import JobService
from app.utils.http import file_response
from app.utils.paths import ensure_tool_dirs
from app.utils.uploads import persist_upload


def enqueue_jobs(params: dict, job_service: JobService) -> list[Job]:
  """Create Noxsongizer jobs from uploaded audio files."""
  upload_base, _ = ensure_tool_dirs(JobTool.NOXSONGIZER)
  jobs: list[Job] = []

  files = params.get("files", [])
  job_ids = [str(uuid4()) for _ in files]
  job_params = {key: value for key, value in params.items() if key != "files"}

  for job_id, file in zip(job_ids, files):
    dest = persist_upload(upload_base, job_id, file)
    job = job_service.create_job(
      tool=JobTool.NOXSONGIZER,
      job_id=job_id,
      input_filename=file.filename,
      input_path=str(dest),
      params=job_params,
    )
    jobs.append(job)

  return jobs


def download_source(job_id: str, job_service: JobService):
  """Return the uploaded source file for a Noxsongizer job."""
  job = job_service.get_job(job_id)
  if not job or job.tool != JobTool.NOXSONGIZER:
    raise NotFoundError("Job not found")
  if not job.input_path:
    raise NotFoundError("Source file not found")

  path = Path(job.input_path)
  if not path.exists() or not path.is_file():
    raise NotFoundError("Source file not found")

  return file_response(path)


def download_output(job_id: str, filename: str, job_service: JobService):
  """Return an output file for a Noxsongizer job."""
  job = job_service.get_job(job_id)
  if not job:
    raise NotFoundError("Job not found")
  if not job.output_path:
    raise NotFoundError("Job outputs are not ready")

  path = Path(job.output_path) / filename
  if not path.exists():
    raise NotFoundError("Output file not found")

  return file_response(path, filename=filename)
