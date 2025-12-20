"""Schemas for File domain payloads."""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict
from sqlmodel import SQLModel

from app.files.model import FileVariant


class FileCreate(SQLModel):
  """Input payload for creating a File."""

  id: Optional[str] = None
  type: str
  name: str
  checksum: str
  size: int
  path: str
  format: str | None = None
  quality: str | int | None = None
  variants: list[FileVariant] | None = None

  model_config = ConfigDict(extra="forbid")


class FileRead(SQLModel):
  """Public representation of a File returned by the API."""

  id: str
  type: str
  name: str
  checksum: str
  size: int
  path: str
  created_at: datetime
  format: str | None = None
  quality: str | int | None = None
  variants: list[FileVariant] | None = None

  model_config = ConfigDict(from_attributes=True, extra="ignore")


class FileUpdate(SQLModel):
  """Internal patch schema for updating file metadata."""

  type: Optional[str] = None
  name: Optional[str] = None
  format: Optional[str] = None
  quality: str | int | None = None
  variants: Optional[list[FileVariant]] = None

  model_config = ConfigDict(extra="forbid")


class PaginatedFiles(BaseModel):
  """Response envelope for paginated file listings."""

  items: list[FileRead]
  total: int
  limit: int
  offset: int
