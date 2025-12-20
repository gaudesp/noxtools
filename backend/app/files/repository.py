"""Repository layer for persisting File entities."""

from __future__ import annotations

from typing import Optional

from sqlalchemy import and_, func, or_
from sqlmodel import Session, select

from app.files.model import File
from app.files.schemas import FileCreate, FileUpdate


class FileRepository:
  """
  Encapsulates database CRUD operations for files.

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

  def create(self, payload: FileCreate) -> File:
    """
    Persist a new file row.

    Args:
      payload: Data required to create the file.

    Returns:
      The freshly persisted File entity.

    Raises:
      SQLAlchemyError: On database failures; caller is responsible for handling.
    """
    file = File(**payload.model_dump(exclude_none=True))
    self.session.add(file)
    try:
      self.session.commit()
    except Exception:
      self.session.rollback()
      raise
    self.session.refresh(file)
    return file

  def get(self, file_id: str) -> Optional[File]:
    """
    Retrieve a file by id.

    Args:
      file_id: Identifier of the file.

    Returns:
      The File if found, otherwise None.
    """
    return self.session.get(File, file_id)

  def get_by_checksum(self, checksum: str) -> Optional[File]:
    """
    Retrieve a file by its checksum.

    Args:
      checksum: SHA-256 checksum.

    Returns:
      The File if found, otherwise None.
    """
    stmt = select(File).where(File.checksum == checksum)
    return self.session.exec(stmt).first()

  def list(
    self,
    *,
    file_type: Optional[str] = None,
    query: Optional[str] = None,
    offset: int = 0,
    limit: int = 50,
  ) -> list[File]:
    """
    Fetch files with optional filtering and pagination.

    Args:
      file_type: Optional file type filter.
      query: Optional case-insensitive name search.
      offset: Rows to skip.
      limit: Maximum rows to return.

    Returns:
      A list of File entities.
    """
    stmt = select(File)
    if file_type:
      stmt = stmt.where(File.type == file_type)
    if query:
      filters = _build_query_filters(query)
      if filters is not None:
        stmt = stmt.where(filters)
    stmt = stmt.order_by(File.created_at.desc()).offset(offset).limit(limit)
    results = self.session.exec(stmt).all()
    return list(results)

  def count(self, *, file_type: Optional[str] = None, query: Optional[str] = None) -> int:
    """
    Count files matching optional filters.

    Args:
      file_type: Optional file type filter.
      query: Optional case-insensitive name search.

    Returns:
      The number of matching files.
    """
    stmt = select(func.count()).select_from(File)
    if file_type:
      stmt = stmt.where(File.type == file_type)
    if query:
      filters = _build_query_filters(query)
      if filters is not None:
        stmt = stmt.where(filters)
    result = self.session.exec(stmt).one()
    return int(result[0] if isinstance(result, tuple) else result)

  def update(self, file_id: str, payload: FileUpdate) -> Optional[File]:
    """
    Apply a partial update to a file.

    Args:
      file_id: Identifier of the file to update.
      payload: Fields to patch.

    Returns:
      The updated File if it exists, otherwise None.
    """
    file = self.get(file_id)
    if not file:
      return None

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
      setattr(file, field, value)

    self.session.add(file)
    try:
      self.session.commit()
    except Exception:
      self.session.rollback()
      raise
    self.session.refresh(file)
    return file

  def delete(self, file_id: str) -> bool:
    """
    Delete a file by id.

    Args:
      file_id: Identifier of the file.

    Returns:
      True if the file was deleted, False if not found.
    """
    file = self.get(file_id)
    if not file:
      return False
    self.session.delete(file)
    try:
      self.session.commit()
    except Exception:
      self.session.rollback()
      raise
    return True


IGNORED_QUERY_TOKENS = {"label", "type"}


def _build_query_filters(query: str):
  tokens = [token.strip() for token in (query or "").split() if token.strip()]
  if not tokens:
    return None

  filters = []
  for token in tokens:
    if token.lower() in IGNORED_QUERY_TOKENS:
      continue
    lowered = token.lower()
    filters.append(
      or_(
        func.lower(File.name).contains(lowered),
        func.lower(File.type) == lowered,
      )
    )

  return and_(*filters) if filters else None
