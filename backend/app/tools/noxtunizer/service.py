"""Tool service for creating Noxtunizer jobs."""

from __future__ import annotations

from app.errors import NotFoundError
from app.jobs.file_links import JobFileRole, JobFileService
from app.jobs.model import Job, JobTool
from app.jobs.service import JobService
from app.utils.files import build_download_name
from app.utils.http import file_response


def enqueue_jobs(params: dict, job_service: JobService) -> list[tuple[Job, str | None]]:
  """Create Noxtunizer jobs from uploaded audio files."""
  files, file_ids, job_params = job_service.split_file_params(params)
  inputs = job_service.prepare_file_inputs(
    files=files,
    file_ids=file_ids,
    expected_type="audio",
    name_suffix="audio",
  )
  return job_service.enqueue_jobs_for_inputs(
    tool=JobTool.NOXTUNIZER,
    inputs=inputs,
    params=job_params,
  )


def download_source(job_id: str, job_service: JobService):
  """Return the uploaded source file for a Noxtunizer job."""
  job = job_service.get_job(job_id)
  if not job or job.tool != JobTool.NOXTUNIZER:
    raise NotFoundError("Job not found")
  file_links = JobFileService(job_service.repo.session)
  input_file = file_links.get_primary_input(job_id)
  if not input_file:
    raise NotFoundError("Source file not found")

  path = file_links.file_service.resolve_path(input_file)
  if not path.exists() or not path.is_file():
    raise NotFoundError("Source file not found")

  label = file_links.get_label(job_id, input_file.id, JobFileRole.INPUT)
  download_name = build_download_name(input_file.name, label)
  return file_response(path, filename=download_name)
