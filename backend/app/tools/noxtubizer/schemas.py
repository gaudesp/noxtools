"""Schemas for Noxtubizer tool requests and responses."""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, ConfigDict


class NoxtubizerJobRequest(BaseModel):
  """Request payload for creating a Noxtubizer job."""

  url: str
  mode: str
  audio_quality: Optional[str] = None
  audio_format: Optional[str] = None
  video_quality: Optional[str] = None
  video_format: Optional[str] = None

  model_config = ConfigDict(arbitrary_types_allowed=True)
