"""Business service layer for managing files."""

from __future__ import annotations

from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session

from app.errors import NotFoundError, ValidationError
from app.files.model import File, FileVariant
from app.files.repository import FileRepository
from app.files.schemas import FileCreate
from app.files.storage import FileStorage
from app.utils.files import safe_unlink


class FileService:
  """
  File orchestration: hashing, deduplication, and storage operations.

  This service does not attach files to jobs; that is handled by the job-file
  relation in later steps.
  """

  def __init__(self, session: Session, *, storage: FileStorage | None = None) -> None:
    self.repo = FileRepository(session)
    self.storage = storage or FileStorage()

  def create_from_upload(
    self,
    upload: UploadFile,
    *,
    file_type: str,
    name: str | None = None,
    format: str | None = None,
    quality: str | int | None = None,
    variants: list[FileVariant] | None = None,
  ) -> File:
    """Persist an uploaded file with checksum-based deduplication."""
    if not file_type:
      raise ValidationError("File type is required")

    filename = self.storage.sanitize_name(name or upload.filename or "file")
    checksum, size = self.storage.hash_stream(upload.file)

    existing = self.repo.get_by_checksum(checksum)
    if existing:
      return existing

    file_id = str(uuid4())
    relative_path = self.storage.build_relative_path(file_id, filename)
    dest_path = self.storage.resolve_path(relative_path)

    self.storage.write_stream(dest_path, upload.file)

    payload = FileCreate(
      id=file_id,
      type=file_type,
      name=filename,
      checksum=checksum,
      size=size,
      path=relative_path,
      format=format,
      quality=quality,
      variants=variants,
    )

    try:
      return self.repo.create(payload)
    except IntegrityError:
      self.storage.remove_path(dest_path)
      existing = self.repo.get_by_checksum(checksum)
      if existing:
        return existing
      raise
    except Exception:
      self.storage.remove_path(dest_path)
      raise

  def create_from_path(
    self,
    source: Path,
    *,
    file_type: str,
    name: str | None = None,
    format: str | None = None,
    quality: str | int | None = None,
    variants: list[FileVariant] | None = None,
  ) -> File:
    """Persist a file from disk with checksum-based deduplication."""
    if not file_type:
      raise ValidationError("File type is required")
    if not source.exists() or not source.is_file():
      raise NotFoundError("Source file not found")

    checksum, size = self.storage.hash_path(source)
    existing = self.repo.get_by_checksum(checksum)
    if existing:
      existing_path = self.storage.resolve_path(existing.path)
      if existing_path.resolve() != source.resolve():
        safe_unlink(source)
      return existing

    file_id = str(uuid4())
    filename = self.storage.sanitize_name(name or source.name)
    relative_path = self.storage.build_relative_path(file_id, filename)
    dest_path = self.storage.resolve_path(relative_path)

    self.storage.move_path(source, dest_path)

    payload = FileCreate(
      id=file_id,
      type=file_type,
      name=filename,
      checksum=checksum,
      size=size,
      path=relative_path,
      format=format,
      quality=quality,
      variants=variants,
    )

    try:
      return self.repo.create(payload)
    except IntegrityError:
      self.storage.remove_path(dest_path)
      existing = self.repo.get_by_checksum(checksum)
      if existing:
        return existing
      raise
    except Exception:
      self.storage.remove_path(dest_path)
      raise

  def delete_file(self, file_id: str) -> bool:
    """Delete a file record and remove its storage folder."""
    file = self.repo.get(file_id)
    if not file:
      return False

    deleted = self.repo.delete(file_id)
    if deleted:
      self.storage.remove_path(self.storage.resolve_path(file.path))
    return deleted

  def resolve_path(self, file: File) -> Path:
    """Resolve the absolute path for a stored file."""
    return self.storage.resolve_path(file.path)

  def list_files(
    self,
    *,
    file_type: str | None = None,
    query: str | None = None,
    offset: int = 0,
    limit: int = 50,
  ) -> list[File]:
    """List files with optional filters and search tokens."""
    return self.repo.list(
      file_type=file_type,
      query=query,
      offset=offset,
      limit=limit,
    )

  def count_files(self, *, file_type: str | None = None, query: str | None = None) -> int:
    """Count files matching optional filters."""
    return self.repo.count(file_type=file_type, query=query)
