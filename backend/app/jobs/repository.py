"""Repository layer for persisting Job entities."""

from __future__ import annotations

from typing import Optional

from sqlalchemy import func
from sqlmodel import Session, select

from app.jobs.model import Job, JobStatus, JobTool, _utcnow
from app.jobs.schemas import JobCreate, JobUpdate


class JobRepository:
  """
  Encapsulates database CRUD operations for jobs.

  This layer performs no business logic: it only maps to and from the database
  using the provided SQLModel session.
  """

  def __init__(self, session: Session) -> None:
    """
    Initialize the repository with a SQLModel session.

    Args:
      session: Active SQLModel session.
    """
    self.session = session

  def create(self, payload: JobCreate) -> Job:
    """
    Persist a new job row.

    Args:
      payload: Data required to create the job.

    Returns:
      The freshly persisted Job entity.

    Raises:
      SQLAlchemyError: On database failures; caller is responsible for handling.
    """
    job = Job(**payload.model_dump(exclude_none=True))
    self.session.add(job)
    try:
      self.session.commit()
    except Exception:
      self.session.rollback()
      raise
    self.session.refresh(job)
    return job

  def get(self, job_id: str) -> Optional[Job]:
    """
    Retrieve a job by id.

    Args:
      job_id: Identifier of the job.

    Returns:
      The Job if found, otherwise None.
    """
    return self.session.get(Job, job_id)

  def list(
    self,
    *,
    tool: Optional[JobTool] = None,
    status: Optional[JobStatus] = None,
    offset: int = 0,
    limit: int = 50,
  ) -> list[Job]:
    """
    Fetch jobs with optional filtering and pagination.

    Args:
      tool: Optional tool filter.
      status: Optional status filter.
      offset: Rows to skip.
      limit: Maximum rows to return.

    Returns:
      A list of Job entities.
    """
    stmt = select(Job)
    if tool:
      stmt = stmt.where(Job.tool == tool)
    if status:
      stmt = stmt.where(Job.status == status)
    stmt = stmt.order_by(Job.created_at.desc()).offset(offset).limit(limit)
    results = self.session.exec(stmt).all()
    return list(results)

  def list_by_signature(
    self,
    signature: str,
    *,
    status: Optional[JobStatus] = None,
  ) -> list[Job]:
    """
    Fetch jobs that share a deterministic signature.

    Args:
      signature: Signature string.
      status: Optional status filter.

    Returns:
      A list of Job entities ordered by creation time (oldest first).
    """
    stmt = select(Job).where(Job.signature == signature)
    if status:
      stmt = stmt.where(Job.status == status)
    stmt = stmt.order_by(Job.created_at.asc())
    results = self.session.exec(stmt).all()
    return list(results)

  def count(self, *, tool: Optional[JobTool] = None, status: Optional[JobStatus] = None) -> int:
    """
    Count jobs matching optional filters.

    Args:
      tool: Optional tool filter.
      status: Optional status filter.

    Returns:
      The number of matching jobs.
    """
    stmt = select(func.count()).select_from(Job)
    if tool:
      stmt = stmt.where(Job.tool == tool)
    if status:
      stmt = stmt.where(Job.status == status)
    result = self.session.exec(stmt).one()
    return int(result[0] if isinstance(result, tuple) else result)

  def update(self, job_id: str, payload: JobUpdate) -> Optional[Job]:
    """
    Apply a partial update to a job.

    Args:
      job_id: Identifier of the job to update.
      payload: Fields to patch.

    Returns:
      The updated Job if it exists, otherwise None.
    """
    job = self.get(job_id)
    if not job:
      return None

    update_data = payload.model_dump(exclude_unset=True)
    update_data["updated_at"] = _utcnow()
    for field, value in update_data.items():
      setattr(job, field, value)

    self.session.add(job)
    try:
      self.session.commit()
    except Exception:
      self.session.rollback()
      raise
    self.session.refresh(job)
    return job

  def delete(self, job_id: str) -> bool:
    """
    Delete a job by id.

    Args:
      job_id: Identifier of the job to delete.

    Returns:
      True if the job was deleted, False if not found.
    """
    job = self.get(job_id)
    if not job:
      return False
    self.session.delete(job)
    try:
      self.session.commit()
    except Exception:
      self.session.rollback()
      raise
    return True
