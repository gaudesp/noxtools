"""Schemas for Noxsongizer tool requests and responses."""

from __future__ import annotations

from typing import List

from fastapi import UploadFile
from pydantic import BaseModel, ConfigDict


class NoxsongizerJobRequest(BaseModel):
  """Request payload for creating Noxsongizer jobs."""

  files: List[UploadFile]

  model_config = ConfigDict(arbitrary_types_allowed=True)
