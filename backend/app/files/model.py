"""Persistent File model and variants."""

from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import Column, JSON
from sqlmodel import Field, SQLModel


def _utcnow() -> datetime:
  """Return a timezone-aware UTC timestamp."""
  return datetime.now(timezone.utc)


class FileVariant(SQLModel):
  """Optional variant metadata for a File."""

  id: str
  label: str
  format: str | None = None
  quality: str | int | None = None

  model_config = {"extra": "forbid"}


class File(SQLModel, table=True):
  """
  Persistent file entity stored in the database.

  Files are deduplicated by checksum and stored under a single storage root.
  """

  __tablename__ = "files"

  id: str = Field(
    default_factory=lambda: str(uuid4()),
    primary_key=True,
    index=True,
    description="Public file identifier.",
  )
  type: str = Field(
    index=True,
    description="Logical file type (audio, video, image, etc.).",
  )
  name: str = Field(description="Original file name.")
  checksum: str = Field(
    index=True,
    unique=True,
    description="SHA-256 checksum for deduplication.",
  )
  size: int = Field(description="File size in bytes.")
  path: str = Field(description="Relative path within the storage root.")
  created_at: datetime = Field(
    default_factory=_utcnow,
    description="When the file was created (UTC).",
  )
  format: str | None = Field(default=None, description="Optional container/format.")
  quality: str | int | None = Field(
    default=None,
    sa_column=Column(JSON),
    description="Optional quality indicator.",
  )
  variants: list[FileVariant] | None = Field(
    default=None,
    sa_column=Column(JSON),
    description="Optional variants metadata.",
  )

  model_config = {"from_attributes": True}
