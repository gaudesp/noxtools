"""Administrative helpers for deleting jobs and their artifacts."""

from __future__ import annotations

from sqlmodel import Session

from app.errors import AppError
from app.jobs.cleanup import JobCleanupService
from app.jobs.file_links import JobFileService
from app.jobs.model import JobStatus
from app.jobs.service import JobService


class JobDeletionError(AppError):
  """Base exception for job deletion errors."""


class JobNotFound(JobDeletionError):
  """Raised when attempting to delete a missing job."""

  status_code = 404
  default_detail = "Job not found"


class JobDeletionForbidden(JobDeletionError):
  """Raised when deletion is not allowed for the job state."""

  status_code = 409
  default_detail = "Job deletion forbidden"


class JobDeletionService:
  """Encapsulates admin-only deletion (DB + filesystem) of jobs."""

  def __init__(self, session: Session) -> None:
    self.job_service = JobService(session)
    self.cleanup = JobCleanupService()
    self.file_links = JobFileService(session)

  def delete_job_and_artifacts(self, job_id: str) -> None:
    """
    Delete a job and its filesystem artifacts.

    This is an admin operation, not a lifecycle transition.
    """
    job = self.job_service.get_job(job_id)
    if not job:
      raise JobNotFound()
    if job.status == JobStatus.RUNNING:
      raise JobDeletionForbidden("Cannot delete a running job")

    self.file_links.unlink_job(job_id)
    self.cleanup.cleanup_job_files(job, keep_input=False)
    self.job_service.delete_job(job_id)
