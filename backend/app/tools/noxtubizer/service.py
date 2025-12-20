"""Tool service for Noxtubizer job creation."""

from __future__ import annotations

from app.errors import NotFoundError
from app.jobs.file_links import JobFileRole, JobFileService
from app.jobs.model import Job, JobTool
from app.jobs.service import JobService
from app.utils.files import build_download_name
from app.utils.http import file_response


def enqueue_jobs(params: dict, job_service: JobService) -> list[tuple[Job, str | None]]:
  """Create Noxtubizer jobs with validated parameters."""
  job_params = params
  job, duplicate_of = job_service.enqueue_job_for_signature(
    tool=JobTool.NOXTUBIZER,
    input_url=job_params.get("url"),
    params=job_params,
    input_filename=job_params.get("url"),
  )
  return [(job, duplicate_of)]


def download_output(job_id: str, filename: str, job_service: JobService):
  """Return an output file for a Noxtubizer job."""
  job = job_service.get_job(job_id)
  if not job or job.tool != JobTool.NOXTUBIZER:
    raise NotFoundError("Job not found")

  file_links = JobFileService(job_service.repo.session)
  outputs = file_links.list_files(job_id, role=JobFileRole.OUTPUT)
  for file, _role in outputs:
    if file.name == filename:
      path = file_links.file_service.resolve_path(file)
      if not path.exists():
        break
      label = file_links.get_label(job_id, file.id, JobFileRole.OUTPUT)
      download_name = build_download_name(file.name, label)
      return file_response(path, filename=download_name)

  raise NotFoundError("Output file not found")
