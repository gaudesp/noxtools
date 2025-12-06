from __future__ import annotations

from typing import Optional

from sqlalchemy import func
from sqlmodel import Session, select

from app.models.job import Job, JobCreate, JobStatus, JobTool, JobUpdate, _utcnow


class JobRepository:
  """
  Persistence layer for Job entities.
  """

  def __init__(self, session: Session) -> None:
    self.session = session

  def create(self, payload: JobCreate) -> Job:
    job = Job(**payload.model_dump())
    self.session.add(job)
    self.session.commit()
    self.session.refresh(job)
    return job

  def get(self, job_id: str) -> Optional[Job]:
    return self.session.get(Job, job_id)

  def list(
    self,
    *,
    tool: Optional[JobTool] = None,
    status: Optional[JobStatus] = None,
    offset: int = 0,
    limit: int = 50,
  ) -> list[Job]:
    stmt = select(Job)
    if tool:
      stmt = stmt.where(Job.tool == tool)
    if status:
      stmt = stmt.where(Job.status == status)
    stmt = stmt.order_by(Job.created_at.desc()).offset(offset).limit(limit)
    results = self.session.exec(stmt).all()
    return list(results)

  def count(self, *, tool: Optional[JobTool] = None, status: Optional[JobStatus] = None) -> int:
    stmt = select(func.count()).select_from(Job)
    if tool:
      stmt = stmt.where(Job.tool == tool)
    if status:
      stmt = stmt.where(Job.status == status)
    return self.session.exec(stmt).one()

  def update(self, job_id: str, payload: JobUpdate) -> Optional[Job]:
    job = self.get(job_id)
    if not job:
      return None

    update_data = payload.model_dump(exclude_unset=True)
    update_data["updated_at"] = _utcnow()
    for field, value in update_data.items():
      setattr(job, field, value)

    self.session.add(job)
    self.session.commit()
    self.session.refresh(job)
    return job

  def delete(self, job_id: str) -> bool:
    job = self.get(job_id)
    if not job:
      return False
    self.session.delete(job)
    self.session.commit()
    return True
