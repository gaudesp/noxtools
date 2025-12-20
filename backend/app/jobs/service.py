"""Business service layer for managing jobs."""

from __future__ import annotations

import hashlib
import json
from typing import Any, Iterable, Optional
from uuid import uuid4

from sqlmodel import Session

from app.errors import ConflictError, NotFoundError, ValidationError
from app.files.model import File
from app.files.service import FileService
from app.jobs.events import JobEvent, job_event_bus
from app.jobs.file_links import JobFileRole, JobFileService
from app.jobs.model import Job, JobStatus, JobTool, _utcnow
from app.jobs.repository import JobRepository
from app.jobs.schemas import JobCreate, JobUpdate
from app.utils.files import append_name_suffix


class JobService:
  """
  Tool-agnostic job orchestration.

  Handles lifecycle transitions, output bookkeeping, and event publishing while
  delegating persistence to the repository.
  """

  def __init__(self, session: Session) -> None:
    """
    Initialize the service with a SQLModel session.

    Args:
      session: Active SQLModel session used by the repository.
    """
    self.repo = JobRepository(session)

  def create_job(
    self,
    *,
    tool: JobTool,
    job_id: Optional[str] = None,
    status: JobStatus = JobStatus.PENDING,
    input_filename: Optional[str] = None,
    input_path: Optional[str] = None,
    params: Optional[dict[str, Any]] = None,
    signature: Optional[str] = None,
    max_attempts: int = 1,
  ) -> Job:
    """
    Create and persist a new job.

    Args:
      tool: Target tool that should process the job.
      job_id: Optional job id override (used for pre-generated ids).
      status: Lifecycle status to assign at creation.
      input_filename: Original name of the uploaded file.
      input_path: Absolute path to the uploaded input file.
      params: Tool-specific parameters.
      signature: Deterministic signature used for deduplication.
      max_attempts: How many times the worker may retry.

    Returns:
      The newly created Job entity.

    Raises:
      Exception: Propagates repository errors to caller.
    """
    payload = JobCreate(
      id=job_id,
      tool=tool,
      status=status,
      input_filename=input_filename,
      input_path=input_path,
      params=params or {},
      signature=signature,
      max_attempts=max_attempts,
    )
    job = self.repo.create(payload)
    self._emit_event("job_created", job=job)
    return job

  def prepare_file_inputs(
    self,
    *,
    files: Iterable[Any],
    file_ids: Iterable[str],
    expected_type: str,
    name_suffix: str | None = None,
  ) -> list[tuple[File, bool]]:
    """Resolve file_ids or uploads into File records."""
    session = self.repo.session
    file_service = FileService(session)
    cleaned_ids = [file_id.strip() for file_id in file_ids if file_id and file_id.strip()]
    if cleaned_ids:
      resolved: list[tuple[File, bool]] = []
      for file_id in cleaned_ids:
        file = file_service.repo.get(file_id)
        if not file:
          raise NotFoundError("File not found")
        if file.type != expected_type:
          raise ValidationError("File type is not supported for this tool")
        resolved.append((file, False))
      return resolved

    inputs: list[tuple[File, bool]] = []
    for upload in files:
      filename = upload.filename or "file"
      name = append_name_suffix(filename, name_suffix) if name_suffix else filename
      inputs.append(
        (
          file_service.create_from_upload(
            upload,
            file_type=expected_type,
            name=name,
            format=self._infer_format(filename),
          ),
          True,
        )
      )
    return inputs

  @staticmethod
  def split_file_params(
    params: dict[str, Any],
    *,
    file_keys: Iterable[str] = ("files", "file_ids"),
  ) -> tuple[list[Any], list[str], dict[str, Any]]:
    """Split file inputs from the remaining job params."""
    files = params.get("files") or []
    file_ids = params.get("file_ids") or []
    excluded = set(file_keys)
    job_params = {key: value for key, value in params.items() if key not in excluded}
    return list(files), list(file_ids), job_params

  @staticmethod
  def build_signature(
    *,
    tool: JobTool,
    input_checksum: str | None = None,
    input_url: str | None = None,
    params: dict[str, Any] | None = None,
    version: str = "v1",
  ) -> str:
    """Build a stable signature for a tool run based on inputs and params."""
    payload: dict[str, Any] = {
      "tool": tool.value,
      "params": {key: value for key, value in (params or {}).items() if value is not None},
    }
    if input_checksum:
      payload["checksum"] = input_checksum
    if input_url:
      payload["url"] = input_url
    raw = json.dumps(payload, sort_keys=True, separators=(",", ":"))
    digest = hashlib.sha256(raw.encode("utf-8")).hexdigest()
    return f"{version}:{digest}"

  def enqueue_job_for_file(
    self,
    *,
    tool: JobTool,
    file_record: File,
    created: bool,
    params: dict[str, Any] | None,
    job_id: str | None = None,
    input_label: str | None = None,
  ) -> tuple[Job, str | None]:
    """Create a job for a single input file with deduplication."""
    session = self.repo.session
    file_service = FileService(session)
    file_links = JobFileService(session)
    resolved_job_id = job_id or str(uuid4())

    signature = self.build_signature(
      tool=tool,
      input_checksum=file_record.checksum,
      params=params,
    )
    active_job, done_job = self.find_signature_matches(signature)

    if active_job:
      if created and file_links.repo.count_by_file(file_record.id) == 0:
        file_service.delete_file(file_record.id)
      raise ConflictError(f"Job already running: {active_job.id}")

    if done_job:
      duplicate_job = self._clone_done_job(
        done_job,
        tool=tool,
        job_id=resolved_job_id,
        input_filename=file_record.name,
        params=params,
        signature=signature,
      )
      if created and file_links.repo.count_by_file(file_record.id) == 0:
        file_service.delete_file(file_record.id)
      return duplicate_job, done_job.id

    job = self.create_job(
      tool=tool,
      job_id=resolved_job_id,
      input_filename=file_record.name,
      input_path=None,
      params=params,
      signature=signature,
    )
    try:
      label = input_label or file_record.type.title()
      file_links.link(job.id, file_record.id, JobFileRole.INPUT, label=label)
    except Exception:
      self.delete_job(job.id)
      if created and file_links.repo.count_by_file(file_record.id) == 0:
        file_service.delete_file(file_record.id)
      raise

    return job, None

  def enqueue_jobs_for_inputs(
    self,
    *,
    tool: JobTool,
    inputs: Iterable[tuple[File, bool]],
    params: dict[str, Any] | None,
    input_label: str | None = None,
    params_once: bool = False,
  ) -> list[tuple[Job, str | None]]:
    """Create jobs for each input, optionally applying params once."""
    jobs: list[tuple[Job, str | None]] = []
    params_applied = False
    for file_record, created in inputs:
      job_params = params
      if params_once:
        job_params = params if params and not params_applied else None
        if job_params:
          params_applied = True

      job, duplicate_of = self.enqueue_job_for_file(
        tool=tool,
        file_record=file_record,
        created=created,
        params=job_params,
        input_label=input_label,
      )
      jobs.append((job, duplicate_of))
    return jobs

  def enqueue_job_for_signature(
    self,
    *,
    tool: JobTool,
    input_checksum: str | None = None,
    input_url: str | None = None,
    params: dict[str, Any] | None,
    job_id: str | None = None,
    input_filename: str | None = None,
  ) -> tuple[Job, str | None]:
    """Create a job from a precomputed signature (no input file required)."""
    resolved_job_id = job_id or str(uuid4())
    signature = self.build_signature(
      tool=tool,
      input_checksum=input_checksum,
      input_url=input_url,
      params=params,
    )

    active_job, done_job = self.find_signature_matches(signature)
    if active_job:
      raise ConflictError(f"Job already running: {active_job.id}")

    if done_job:
      duplicate_job = self._clone_done_job(
        done_job,
        tool=tool,
        job_id=resolved_job_id,
        input_filename=input_filename,
        params=params,
        signature=signature,
      )
      return duplicate_job, done_job.id

    job = self.create_job(
      tool=tool,
      job_id=resolved_job_id,
      input_filename=input_filename,
      params=params,
      signature=signature,
    )
    return job, None

  def _clone_done_job(
    self,
    done_job: Job,
    *,
    tool: JobTool,
    job_id: str,
    input_filename: str | None,
    params: dict[str, Any] | None,
    signature: str,
  ) -> Job:
    file_links = JobFileService(self.repo.session)
    duplicate_job = self.create_job(
      tool=tool,
      job_id=job_id,
      status=JobStatus.DONE,
      input_filename=input_filename,
      input_path=None,
      params=params,
      signature=signature,
    )
    try:
      file_links.clone_links(done_job.id, duplicate_job.id)
      result = file_links.build_result_payload(
        duplicate_job.id,
        done_job.result.get("summary", {}),
      )
      output_files = [
        file.name
        for file, _role, _label in file_links.list_files_with_labels(
          duplicate_job.id,
          role=JobFileRole.OUTPUT,
        )
      ]
      updated = self.update_job(
        duplicate_job.id,
        JobUpdate(
          result=result,
          output_files=output_files,
          started_at=_utcnow(),
          completed_at=_utcnow(),
        ),
      )
    except Exception:
      try:
        file_links.unlink_job(duplicate_job.id)
      except Exception:
        pass
      self.delete_job(duplicate_job.id)
      raise

    return updated or duplicate_job

  @staticmethod
  def _infer_format(name: str | None) -> str | None:
    if not name:
      return None
    dot = name.rfind(".")
    if dot == -1:
      return None
    ext = name[dot + 1 :].strip().lower()
    return ext or None

  def get_job(self, job_id: str) -> Optional[Job]:
    """
    Fetch a single job by id.

    Args:
      job_id: Identifier of the job.

    Returns:
      The job if found, otherwise None.
    """
    return self.repo.get(job_id)

  def list_jobs(
    self,
    *,
    tool: Optional[JobTool] = None,
    status: Optional[JobStatus] = None,
    offset: int = 0,
    limit: int = 50,
  ) -> list[Job]:
    """
    List jobs with optional filters.

    Args:
      tool: Optional tool filter.
      status: Optional status filter.
      offset: Rows to skip.
      limit: Maximum rows to return.

    Returns:
      A list of jobs.
    """
    return self.repo.list(tool=tool, status=status, offset=offset, limit=limit)

  def find_signature_matches(self, signature: str) -> tuple[Optional[Job], Optional[Job]]:
    """
    Return (active_job, done_job) for the given signature if any exist.

    Active jobs are pending or running. Done jobs are completed successfully.
    """
    matches = self.repo.list_by_signature(signature)
    active = next(
      (job for job in matches if job.status in (JobStatus.PENDING, JobStatus.RUNNING)),
      None,
    )
    done = next((job for job in matches if job.status == JobStatus.DONE), None)
    return active, done

  def count_jobs(
    self,
    *,
    tool: Optional[JobTool] = None,
    status: Optional[JobStatus] = None,
  ) -> int:
    """
    Count jobs by optional tool/status filters.

    Args:
      tool: Optional tool filter.
      status: Optional status filter.

    Returns:
      The number of matching jobs.
    """
    return self.repo.count(tool=tool, status=status)

  def mark_running(
    self,
    job_id: str,
    *,
    worker_id: Optional[str] = None,
    attempt: Optional[int] = None,
  ) -> Optional[Job]:
    """
    Mark a job as running and lock it to a worker.

    Args:
      job_id: Identifier of the job.
      worker_id: Identifier of the worker acquiring the job.
      attempt: Attempt counter to set; defaults to previous + 1 if omitted.

    Returns:
      The updated job, or None if not found.
    """
    job = self.get_job(job_id)
    if not job:
      return None

    next_attempt = attempt if attempt is not None else (job.attempt + 1)
    update = JobUpdate(
      status=JobStatus.RUNNING,
      started_at=_utcnow() if job.started_at is None else job.started_at,
      locked_at=_utcnow(),
      locked_by=worker_id,
      attempt=next_attempt,
    )
    return self._update_and_emit(job_id, update)

  def mark_completed(
    self,
    job_id: str,
    *,
    output_path: Optional[str],
    output_files: Optional[list[str]] = None,
    result: Optional[dict[str, Any]] = None,
  ) -> Optional[Job]:
    """
    Mark a job as completed and store outputs.

    Args:
      job_id: Identifier of the job.
      output_path: Directory containing generated outputs.
      output_files: List of generated output files.
      result: Tool-specific result metadata.

    Returns:
      The updated job, or None if not found.
    """
    existing = self.get_job(job_id)
    if not existing or existing.status == JobStatus.ABORTED:
      return existing

    update = JobUpdate(
      status=JobStatus.DONE,
      output_path=output_path,
      output_files=output_files,
      result=result,
      completed_at=_utcnow(),
      locked_at=None,
      locked_by=None,
    )
    return self._update_and_emit(job_id, update)

  def mark_error(self, job_id: str, message: str) -> Optional[Job]:
    """
    Mark a job as errored with a message.

    Args:
      job_id: Identifier of the job.
      message: Error details.

    Returns:
      The updated job, or None if not found.
    """
    existing = self.get_job(job_id)
    if not existing:
      return None

    if existing.status == JobStatus.ABORTED:
      return existing

    update = JobUpdate(
      status=JobStatus.ERROR,
      error_message=message,
      completed_at=_utcnow(),
      locked_at=None,
      locked_by=None,
    )
    return self._update_and_emit(job_id, update)

  def mark_aborted(
    self,
    job_id: str,
    *,
    message: Optional[str] = None,
  ) -> Optional[Job]:
    """
    Mark a running job as aborted, clear outputs, and release locks.

    Args:
      job_id: Identifier of the job to abort.
      message: Optional explanation for the abort.

    Returns:
      The updated job, or None if not found.

    Raises:
      ConflictError: If the job is not currently running.
    """
    job = self.get_job(job_id)
    if not job:
      return None
    if job.status != JobStatus.RUNNING:
      raise ConflictError("Only running jobs can be aborted")

    update = JobUpdate(
      status=JobStatus.ABORTED,
      error_message=message,
      completed_at=_utcnow(),
      locked_at=None,
      locked_by=None,
      output_path=None,
      output_files=[],
      result={},
    )
    return self._update_and_emit(job_id, update)

  def retry_job(self, job_id: str) -> Optional[Job]:
    """
    Reset a failed or aborted job back to pending.

    Args:
      job_id: Identifier of the job to retry.

    Returns:
      The updated job, or None if not found.

    Raises:
      ConflictError: If the job is not retryable.
    """
    job = self.get_job(job_id)
    if not job:
      return None
    if job.status not in (JobStatus.ERROR, JobStatus.ABORTED):
      raise ConflictError("Only errored or aborted jobs can be retried")

    update = JobUpdate(
      status=JobStatus.PENDING,
      output_path=None,
      output_files=[],
      result={},
      error_message=None,
      started_at=None,
      completed_at=None,
      locked_at=None,
      locked_by=None,
    )
    return self._update_and_emit(job_id, update)

  def update_outputs(
    self,
    job_id: str,
    *,
    output_path: Optional[str] = None,
    output_files: Optional[list[str]] = None,
    result: Optional[dict[str, Any]] = None,
  ) -> Optional[Job]:
    """
    Update output metadata without changing status.

    Args:
      job_id: Identifier of the job.
      output_path: Directory containing generated outputs.
      output_files: List of generated output files.
      result: Tool-specific result metadata.

    Returns:
      The updated job, or None if not found.
    """
    update = JobUpdate(
      output_path=output_path,
      output_files=output_files,
      result=result,
    )
    return self._update_and_emit(job_id, update)

  def update_status(self, job_id: str, status: JobStatus) -> Optional[Job]:
    """
    Update only the job status.

    Args:
      job_id: Identifier of the job.
      status: New status value.

    Returns:
      The updated job, or None if not found.
    """
    update = JobUpdate(status=status)
    return self._update_and_emit(job_id, update)

  def update_job(self, job_id: str, payload: JobUpdate) -> Optional[Job]:
    """
    Apply an arbitrary partial update to a job.

    Args:
      job_id: Identifier of the job.
      payload: Fields to patch.

    Returns:
      The updated job, or None if not found.
    """
    return self._update_and_emit(job_id, payload)

  def delete_job(self, job_id: str) -> bool:
    """
    Remove a job and emit deletion event.

    Args:
      job_id: Identifier of the job.

    Returns:
      True if deleted, False if missing.
    """
    deleted = self.repo.delete(job_id)
    if deleted:
      self._emit_event("job_deleted", job_id=job_id)
    return deleted

  def _update_and_emit(self, job_id: str, payload: JobUpdate) -> Optional[Job]:
    """
    Persist an update and emit a job_updated event.

    Args:
      job_id: Identifier of the job.
      payload: Update payload.

    Returns:
      The updated job if found, otherwise None.
    """
    job = self.repo.update(job_id, payload)
    if job:
      self._emit_event("job_updated", job=job)
    return job

  def _emit_event(self, event_type: str, **data: Any) -> None:
    """
    Safely publish a job event without raising upstream errors.

    Args:
      event_type: Event name.
      **data: Event payload.
    """
    try:
      if "job" in data and isinstance(data["job"], Job):
        event = JobEvent(type=event_type, payload={"job": data["job"].model_dump(mode="json")})
      else:
        event = JobEvent(type=event_type, payload=data)
      job_event_bus.publish_sync(event)
    except Exception:
      pass
