from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Any, Optional
from uuid import uuid4

from sqlalchemy import JSON, Column
from sqlmodel import Field, SQLModel


class JobStatus(str, Enum):
  PENDING = "pending"
  RUNNING = "running"
  DONE = "done"
  ERROR = "error"


class JobTool(str, Enum):
  NOXSONGIZER = "noxsongizer"
  NOXELIZER = "noxelizer"


def _utcnow() -> datetime:
  return datetime.now(timezone.utc)


class JobBase(SQLModel):
  tool: JobTool = Field(index=True, description="Which tool should process this job")
  status: JobStatus = Field(default=JobStatus.PENDING, index=True)
  input_filename: Optional[str] = Field(default=None, description="Original uploaded filename")
  input_path: Optional[str] = Field(default=None, description="Absolute path to the uploaded input file")
  output_path: Optional[str] = Field(default=None, description="Directory containing generated outputs")
  output_files: list[str] = Field(default_factory=list, sa_column=Column(JSON), description="Generated output files relative to output_path")
  params: dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON), description="Tool-specific parameters")
  result: dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON), description="Tool-specific results metadata")
  error_message: Optional[str] = Field(default=None, description="Last error details if the job failed")
  created_at: datetime = Field(default_factory=_utcnow)
  updated_at: datetime = Field(default_factory=_utcnow)
  started_at: Optional[datetime] = Field(default=None)
  completed_at: Optional[datetime] = Field(default=None)
  locked_at: Optional[datetime] = Field(default=None, index=True)
  locked_by: Optional[str] = Field(default=None, description="Worker identifier currently owning the job")
  attempt: int = Field(default=0, description="How many times the job has been attempted")
  max_attempts: int = Field(default=1, description="Max retry attempts allowed for the job")


class Job(JobBase, table=True):
  __tablename__ = "jobs"

  id: str = Field(
    default_factory=lambda: str(uuid4()),
    primary_key=True,
    index=True,
    description="Public job identifier",
  )


class JobCreate(JobBase):
  pass


class JobRead(JobBase):
  id: str


class JobUpdate(SQLModel):
  status: Optional[JobStatus] = None
  input_filename: Optional[str] = None
  input_path: Optional[str] = None
  output_path: Optional[str] = None
  output_files: Optional[list[str]] = None
  params: Optional[dict[str, Any]] = None
  result: Optional[dict[str, Any]] = None
  error_message: Optional[str] = None
  started_at: Optional[datetime] = None
  completed_at: Optional[datetime] = None
  locked_at: Optional[datetime] = None
  locked_by: Optional[str] = None
  attempt: Optional[int] = None
  max_attempts: Optional[int] = None
