"""Schemas for job API payloads and execution results."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict
from sqlmodel import Field, SQLModel

from app.jobs.model import JobStatus, JobTool


class JobCreate(SQLModel):
  """
  Input payload for creating a new job.

  Client-supplied data is intentionally minimal; server-managed fields are set
  by services and workers.
  """

  id: Optional[str] = None
  tool: JobTool
  status: JobStatus = Field(
    default=JobStatus.PENDING,
    description="Server-managed lifecycle status; callers should leave default.",
  )
  input_filename: Optional[str] = None
  input_path: Optional[str] = None
  params: dict[str, Any] = Field(default_factory=dict)
  signature: Optional[str] = None
  max_attempts: int = Field(default=1, ge=1)

  model_config = ConfigDict(extra="forbid")


class JobRead(SQLModel):
  """
  Public representation of a job returned by the API.
  """

  id: str
  tool: JobTool
  status: JobStatus
  input_filename: Optional[str] = None
  input_path: Optional[str] = None
  output_path: Optional[str] = None
  output_files: list[str] = Field(default_factory=list)
  params: dict[str, Any] = Field(default_factory=dict)
  signature: Optional[str] = None
  result: dict[str, Any] = Field(default_factory=dict)
  error_message: Optional[str] = None
  created_at: datetime
  updated_at: datetime
  started_at: Optional[datetime] = None
  completed_at: Optional[datetime] = None
  locked_at: Optional[datetime] = None
  locked_by: Optional[str] = None
  attempt: int
  max_attempts: int

  model_config = ConfigDict(from_attributes=True, extra="ignore")


class JobUpdate(SQLModel):
  """
  Internal patch schema for updating job fields during processing.
  """

  status: Optional[JobStatus] = None
  input_filename: Optional[str] = None
  input_path: Optional[str] = None
  output_path: Optional[str] = None
  output_files: Optional[list[str]] = None
  params: Optional[dict[str, Any]] = None
  signature: Optional[str] = None
  result: Optional[dict[str, Any]] = None
  error_message: Optional[str] = None
  started_at: Optional[datetime] = None
  completed_at: Optional[datetime] = None
  locked_at: Optional[datetime] = None
  locked_by: Optional[str] = None
  attempt: Optional[int] = None
  max_attempts: Optional[int] = None

  model_config = ConfigDict(extra="forbid")


class PaginatedJobs(BaseModel):
  """Response envelope for paginated job listings."""

  items: list[JobRead]
  total: int
  limit: int
  offset: int


class JobEnqueued(BaseModel):
  """Metadata for a newly created job."""

  job_id: str
  filename: Optional[str] = None
  duplicate_of: Optional[str] = None


class JobsEnqueued(BaseModel):
  """Standard response envelope for job creation."""

  jobs: list[JobEnqueued]


@dataclass
class JobOutputFile:
  """Descriptor for an output file produced by an executor."""

  path: Path
  type: str
  name: str | None = None
  format: str | None = None
  quality: str | int | None = None
  label: str | None = None


@dataclass
class JobExecutionResult:
  """Normalized output payload returned by executors."""

  summary: dict[str, Any]
  output_files: list[JobOutputFile] = field(default_factory=list)
  cleanup_paths: list[Path] = field(default_factory=list)
