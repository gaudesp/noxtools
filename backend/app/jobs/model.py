"""Domain models for jobs in the Noxtools backend."""

from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Any, Optional
from uuid import uuid4

from sqlalchemy import JSON, Column
from sqlmodel import Field, SQLModel


def _utcnow() -> datetime:
  """Return a timezone-aware UTC timestamp."""
  return datetime.now(timezone.utc)


class JobStatus(str, Enum):
  """Lifecycle states for a job."""

  PENDING = "pending"
  RUNNING = "running"
  DONE = "done"
  ERROR = "error"
  ABORTED = "aborted"


class JobTool(str, Enum):
  """Identifiers for supported processing tools."""

  NOXSONGIZER = "noxsongizer"
  NOXELIZER = "noxelizer"
  NOXTUBIZER = "noxtubizer"
  NOXTUNIZER = "noxtunizer"


class Job(SQLModel, table=True):
  """
  Persistent job entity stored in the database.

  Only server-managed fields should be persisted here; input data is minimal and
  user-provided fields remain explicit to keep a clear separation of concerns.
  """

  __tablename__ = "jobs"

  id: str = Field(
    default_factory=lambda: str(uuid4()),
    primary_key=True,
    index=True,
    description="Public job identifier.",
  )
  tool: JobTool = Field(index=True, description="Which tool should process this job.")
  status: JobStatus = Field(
    default=JobStatus.PENDING,
    index=True,
    description="Current lifecycle status.",
  )
  input_filename: Optional[str] = Field(
    default=None,
    description="Original uploaded filename.",
  )
  input_path: Optional[str] = Field(
    default=None,
    description="Absolute path to the uploaded input file.",
  )
  output_path: Optional[str] = Field(
    default=None,
    description="Directory containing generated outputs.",
  )
  output_files: list[str] = Field(
    default_factory=list,
    sa_column=Column(JSON),
    description="Generated output files relative to output_path.",
  )
  params: dict[str, Any] = Field(
    default_factory=dict,
    sa_column=Column(JSON),
    description="Tool-specific parameters.",
  )
  signature: Optional[str] = Field(
    default=None,
    index=True,
    description="Deterministic signature for deduplication.",
  )
  result: dict[str, Any] = Field(
    default_factory=dict,
    sa_column=Column(JSON),
    description="Tool-specific results metadata.",
  )
  error_message: Optional[str] = Field(
    default=None,
    description="Last error details if the job failed.",
  )
  created_at: datetime = Field(
    default_factory=_utcnow,
    description="When the job was created (UTC).",
  )
  updated_at: datetime = Field(
    default_factory=_utcnow,
    description="When the job was last updated (UTC).",
  )
  started_at: Optional[datetime] = Field(
    default=None,
    description="When processing started (UTC).",
  )
  completed_at: Optional[datetime] = Field(
    default=None,
    description="When processing finished (UTC).",
  )
  locked_at: Optional[datetime] = Field(
    default=None,
    index=True,
    description="When a worker locked the job (UTC).",
  )
  locked_by: Optional[str] = Field(
    default=None,
    description="Identifier of the worker currently owning the lock.",
  )
  attempt: int = Field(
    default=0,
    description="How many times the job has been attempted.",
  )
  max_attempts: int = Field(
    default=1,
    description="Max retry attempts allowed for the job.",
  )

  model_config = {"from_attributes": True}
