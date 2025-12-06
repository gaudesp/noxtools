from enum import Enum
from typing import Optional
from pydantic import BaseModel

class JobStatus(str, Enum):
  PENDING = "pending"
  RUNNING = "running"
  DONE = "done"
  ERROR = "error"

class Job(BaseModel):
  id: str
  tool: str  # "noxsongizer" | "noxelizer"
  status: JobStatus
  input_path: Optional[str] = None
  output_path: Optional[str] = None
  error_message: Optional[str] = None
