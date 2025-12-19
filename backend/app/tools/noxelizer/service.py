"""Tool service for creating Noxelizer jobs."""

from __future__ import annotations

from pathlib import Path
from uuid import uuid4

from app.errors import NotFoundError
from app.jobs.model import Job, JobTool
from app.jobs.service import JobService
from app.utils.images import image_variant_path
from app.utils.http import file_response
from app.utils.paths import ensure_tool_dirs
from app.utils.uploads import persist_upload


def enqueue_jobs(params: dict, job_service: JobService) -> list[Job]:
  """Create Noxelizer jobs from uploaded images and attach optional params."""
  upload_base, _ = ensure_tool_dirs(JobTool.NOXELIZER)
  jobs: list[Job] = []

  files = params.get("files", [])
  job_ids = [str(uuid4()) for _ in files]
  job_params = {key: value for key, value in params.items() if key != "files"}
  params_applied = False

  for job_id, file in zip(job_ids, files):
    dest = persist_upload(upload_base, job_id, file, variant="thumb")

    job_params_for_job = job_params if job_params and not params_applied else None
    if job_params_for_job:
      params_applied = True

    job = job_service.create_job(
      tool=JobTool.NOXELIZER,
      job_id=job_id,
      input_filename=file.filename,
      input_path=str(dest),
      params=job_params_for_job,
    )
    jobs.append(job)

  return jobs


def download_source(job_id: str, job_service: JobService, *, variant: str | None):
  """Return the uploaded source image (or variant) for a Noxelizer job."""
  job = job_service.get_job(job_id)
  if not job or job.tool != JobTool.NOXELIZER:
    raise NotFoundError("Job not found")

  if not job.input_path:
    raise NotFoundError("Source file not found")

  original_path = Path(job.input_path)
  path = original_path

  if variant:
    try:
      variant_path = image_variant_path(original_path, variant=variant)
    except KeyError:
      variant_path = None
    if variant_path and variant_path.exists() and variant_path.is_file():
      path = variant_path

  if not path.exists() or not path.is_file():
    raise NotFoundError("Source file not found")

  return file_response(path)


def download_output(job_id: str, filename: str, job_service: JobService):
  """Return an output file for a Noxelizer job."""
  job = job_service.get_job(job_id)
  if not job:
    raise NotFoundError("Job not found")
  if not job.output_path:
    raise NotFoundError("Job outputs are not ready")

  path = Path(job.output_path) / filename
  if not path.exists():
    raise NotFoundError("Output file not found")

  return file_response(path, filename=filename)
