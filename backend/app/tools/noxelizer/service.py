"""Tool service for creating Noxelizer jobs."""

from __future__ import annotations

from app.errors import NotFoundError
from app.jobs.file_links import JobFileRole, JobFileService
from app.jobs.model import Job, JobTool
from app.jobs.service import JobService
from fastapi.responses import Response

from app.utils.files import build_download_name
from app.utils.http import file_response
from app.utils.images import build_image_variant


def enqueue_jobs(params: dict, job_service: JobService) -> list[tuple[Job, str | None]]:
  """Create Noxelizer jobs from uploaded images and attach optional params."""
  files, file_ids, job_params = job_service.split_file_params(params)
  inputs = job_service.prepare_file_inputs(
    files=files,
    file_ids=file_ids,
    expected_type="image",
    name_suffix="image",
  )
  return job_service.enqueue_jobs_for_inputs(
    tool=JobTool.NOXELIZER,
    inputs=inputs,
    params=job_params,
    params_once=True,
  )


def download_source(
  job_id: str,
  job_service: JobService,
  *,
  variant: str | None,
) -> Response:
  """Return the uploaded source image (or variant) for a Noxelizer job."""
  job = job_service.get_job(job_id)
  if not job or job.tool != JobTool.NOXELIZER:
    raise NotFoundError("Job not found")

  file_links = JobFileService(job_service.repo.session)
  input_file = file_links.get_primary_input(job_id)
  if not input_file:
    raise NotFoundError("Source file not found")

  path = file_links.file_service.resolve_path(input_file)
  if not path.exists() or not path.is_file():
    raise NotFoundError("Source file not found")

  if variant:
    rendered = build_image_variant(path, variant=variant)
    if rendered:
      content, media_type = rendered
      return Response(content=content, media_type=media_type)

  label = file_links.get_label(job_id, input_file.id, JobFileRole.INPUT)
  download_name = build_download_name(input_file.name, label)
  return file_response(path, filename=download_name)


def download_output(job_id: str, filename: str, job_service: JobService):
  """Return an output file for a Noxelizer job."""
  job = job_service.get_job(job_id)
  if not job:
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
