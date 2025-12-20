"""Schemas for Noxtunizer tool requests and responses."""

from __future__ import annotations

from typing import List

from fastapi import UploadFile
from pydantic import BaseModel, ConfigDict, Field


class NoxtunizerJobRequest(BaseModel):
  """Request payload for creating Noxtunizer jobs."""

  files: List[UploadFile] = Field(default_factory=list)
  file_ids: List[str] = Field(default_factory=list)

  model_config = ConfigDict(arbitrary_types_allowed=True)
