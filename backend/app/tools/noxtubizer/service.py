"""Tool service for Noxtubizer job creation."""

from __future__ import annotations

from pathlib import Path
from uuid import uuid4

from app.errors import NotFoundError
from app.jobs.model import Job, JobTool
from app.jobs.service import JobService
from app.utils.http import file_response


def enqueue_jobs(params: dict, job_service: JobService) -> list[Job]:
  """Create Noxtubizer jobs with validated parameters."""
  jobs: list[Job] = []
  job_ids = [str(uuid4())]

  job = job_service.create_job(
    tool=JobTool.NOXTUBIZER,
    job_id=job_ids[0],
    input_filename=params["url"],
    params=params,
  )
  jobs.append(job)
  return jobs


def download_output(job_id: str, filename: str, job_service: JobService):
  """Return an output file for a Noxtubizer job."""
  job = job_service.get_job(job_id)
  if not job or job.tool != JobTool.NOXTUBIZER:
    raise NotFoundError("Job not found")

  if not job.output_path:
    raise NotFoundError("Job outputs are not ready")

  path = Path(job.output_path) / filename
  if not path.exists():
    raise NotFoundError("Output file not found")

  return file_response(path)
