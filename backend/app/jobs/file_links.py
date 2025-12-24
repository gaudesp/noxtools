"""Job-file relations and reference cleanup."""

from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Iterable, Optional

from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlmodel import Field, Session, SQLModel, select

from app.files.model import File
from app.files.service import FileService
from app.files.storage import FileStorage


def _utcnow() -> datetime:
  """Return a timezone-aware UTC timestamp."""
  return datetime.now(timezone.utc)


class JobFileRole(str, Enum):
  """Role of a file in relation to a job."""

  INPUT = "input"
  OUTPUT = "output"


class JobFile(SQLModel, table=True):
  """Explicit relation between a job and a file."""

  __tablename__ = "job_files"

  job_id: str = Field(foreign_key="jobs.id", primary_key=True, index=True)
  file_id: str = Field(foreign_key="files.id", primary_key=True, index=True)
  role: JobFileRole = Field(primary_key=True, index=True)
  label: str | None = Field(default=None, description="Display label for downloads.")
  created_at: datetime = Field(default_factory=_utcnow)

  model_config = {"from_attributes": True}


class JobFileRepository:
  """
  Encapsulates database CRUD operations for job-file relations.
  """

  def __init__(self, session: Session) -> None:
    self.session = session

  def create(
    self,
    job_id: str,
    file_id: str,
    role: JobFileRole,
    label: str | None = None,
  ) -> JobFile:
    link = JobFile(job_id=job_id, file_id=file_id, role=role, label=label)
    self.session.add(link)
    try:
      self.session.commit()
    except IntegrityError:
      self.session.rollback()
      existing = self.get(job_id, file_id, role)
      if existing:
        return existing
      raise
    except Exception:
      self.session.rollback()
      raise
    return link

  def get(self, job_id: str, file_id: str, role: JobFileRole) -> Optional[JobFile]:
    stmt = (
      select(JobFile)
      .where(JobFile.job_id == job_id)
      .where(JobFile.file_id == file_id)
      .where(JobFile.role == role)
    )
    return self.session.exec(stmt).first()

  def list_for_job(self, job_id: str) -> list[JobFile]:
    stmt = select(JobFile).where(JobFile.job_id == job_id)
    return list(self.session.exec(stmt).all())

  def count_by_file(self, file_id: str) -> int:
    stmt = select(func.count()).select_from(JobFile).where(JobFile.file_id == file_id)
    result = self.session.exec(stmt).one()
    return int(result[0] if isinstance(result, tuple) else result)

  def delete_for_job(self, job_id: str) -> int:
    links = self.list_for_job(job_id)
    if not links:
      return 0

    for link in links:
      self.session.delete(link)

    try:
      self.session.commit()
    except Exception:
      self.session.rollback()
      raise
    return len(links)

  def delete(self, job_id: str, file_id: str, role: JobFileRole) -> bool:
    link = self.get(job_id, file_id, role)
    if not link:
      return False

    self.session.delete(link)
    try:
      self.session.commit()
    except Exception:
      self.session.rollback()
      raise
    return True


class JobFileService:
  """
  Orchestrates job-file links and deterministic file cleanup.
  """

  def __init__(self, session: Session, *, storage: FileStorage | None = None) -> None:
    self.repo = JobFileRepository(session)
    self.file_service = FileService(session, storage=storage)

  def link(
    self,
    job_id: str,
    file_id: str,
    role: JobFileRole,
    *,
    label: str | None = None,
  ) -> JobFile:
    """Attach a file to a job with the given role."""
    return self.repo.create(job_id, file_id, role, label)

  def link_many(
    self,
    job_id: str,
    items: Iterable[tuple[str, JobFileRole] | tuple[str, JobFileRole, str | None]],
  ) -> list[JobFile]:
    """Attach multiple files to a job."""
    created: list[JobFile] = []
    for item in items:
      if len(item) == 2:
        file_id, role = item
        label = None
      else:
        file_id, role, label = item
      created.append(self.link(job_id, file_id, role, label=label))
    return created

  def get_label(self, job_id: str, file_id: str, role: JobFileRole) -> str | None:
    """Return the label stored on a job-file link."""
    link = self.repo.get(job_id, file_id, role)
    return link.label if link else None

  def unlink(self, job_id: str, file_id: str, role: JobFileRole) -> bool:
    """Remove a single job-file link and delete orphaned files."""
    deleted = self.repo.delete(job_id, file_id, role)
    if deleted and self.repo.count_by_file(file_id) == 0:
      self.file_service.delete_file(file_id)
    return deleted

  def list_files(
    self,
    job_id: str,
    *,
    role: JobFileRole | None = None,
  ) -> list[tuple[File, JobFileRole]]:
    """Return File entities attached to a job, optionally filtered by role."""
    links = self.list_links(job_id, role=role)

    files: list[tuple[object, JobFileRole]] = []
    for link in links:
      file = self.file_service.repo.get(link.file_id)
      if file:
        files.append((file, link.role))
    return files

  def list_links(
    self,
    job_id: str,
    *,
    role: JobFileRole | None = None,
  ) -> list[JobFile]:
    """Return job-file link rows, optionally filtered by role."""
    links = self.repo.list_for_job(job_id)
    if role:
      links = [link for link in links if link.role == role]
    return links

  def list_files_with_labels(
    self,
    job_id: str,
    *,
    role: JobFileRole | None = None,
  ) -> list[tuple[File, JobFileRole, str | None]]:
    """Return File entities with role + label attached to a job."""
    links = self.list_links(job_id, role=role)
    files: list[tuple[object, JobFileRole, str | None]] = []
    for link in links:
      file = self.file_service.repo.get(link.file_id)
      if file:
        files.append((file, link.role, link.label))
    return files

  def build_result_payload(self, job_id: str, summary: dict | None) -> dict:
    """Build the standard result payload for a job."""
    files = self.list_files_with_labels(job_id)
    ordered = sorted(
      files,
      key=lambda item: 0 if item[1] == JobFileRole.INPUT else 1,
    )
    payload = [
      {"file": file.model_dump(mode="json"), "role": role.value, "label": label}
      for file, role, label in ordered
    ]
    return {"summary": summary or {}, "files": payload}

  def clone_links(self, source_job_id: str, target_job_id: str) -> list[JobFile]:
    """Copy all links from one job to another."""
    links = self.repo.list_for_job(source_job_id)
    created: list[JobFile] = []
    for link in links:
      created.append(
        self.link(
          target_job_id,
          link.file_id,
          link.role,
          label=link.label,
        )
      )
    return created

  def get_primary_input(self, job_id: str) -> File | None:
    """Return the first input file attached to a job, if any."""
    inputs = self.list_files(job_id, role=JobFileRole.INPUT)
    return inputs[0][0] if inputs else None

  def unlink_job(self, job_id: str) -> list[str]:
    """
    Remove all file links for a job and delete orphaned files.

    Returns:
      List of file ids that were deleted.
    """
    links = self.repo.list_for_job(job_id)
    if not links:
      return []

    file_ids = {link.file_id for link in links}
    self.repo.delete_for_job(job_id)

    deleted: list[str] = []
    for file_id in file_ids:
      if self.repo.count_by_file(file_id) == 0:
        if self.file_service.delete_file(file_id):
          deleted.append(file_id)
    return deleted
