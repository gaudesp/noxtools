"""Administrative helpers for deleting jobs and their artifacts."""

from __future__ import annotations

from sqlmodel import Session

from app.models.job import JobStatus
from app.services.job_cleanup_service import JobCleanupService
from app.services.job_service import JobService


class JobDeletionError(Exception):
  """Base exception for job deletion errors."""


class JobNotFound(JobDeletionError):
  """Raised when attempting to delete a missing job."""


class JobDeletionForbidden(JobDeletionError):
  """Raised when deletion is not allowed for the job state."""


class JobDeletionService:
  """Encapsulates admin-only deletion (DB + filesystem) of jobs."""

  def __init__(self, session: Session) -> None:
    self.job_service = JobService(session)
    self.cleanup = JobCleanupService()

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

    self.cleanup.cleanup_job_files(job, keep_input=False)
    self.job_service.delete_job(job_id)
