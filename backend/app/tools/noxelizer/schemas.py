"""Schemas for Noxelizer tool requests and responses."""

from __future__ import annotations

from typing import List, Optional

from fastapi import UploadFile
from pydantic import BaseModel, ConfigDict


class NoxelizerJobRequest(BaseModel):
  """Request payload for creating Noxelizer jobs."""

  files: List[UploadFile]
  fps: Optional[int] = None
  duration: Optional[float] = None
  final_hold: Optional[float] = None

  model_config = ConfigDict(arbitrary_types_allowed=True)
