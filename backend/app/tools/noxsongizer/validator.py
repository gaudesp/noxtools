"""Validation helpers for Noxsongizer requests."""

from __future__ import annotations

from app.tools.noxsongizer.schemas import NoxsongizerJobRequest
from app.utils.uploads import validate_uploads

AUDIO_EXTENSIONS = {
  "wav",
  "mp3",
  "flac",
  "m4a",
  "aac",
  "ogg",
  "opus",
  "aiff",
  "aif",
  "alac",
  "wma",
  "mp4",
  "webm",
}


def validate_request(payload: NoxsongizerJobRequest) -> dict:
  """Validate Noxsongizer uploads and return params."""
  files = validate_uploads(
    payload.files,
    allowed_extensions=AUDIO_EXTENSIONS,
    allowed_mime_prefixes={"audio/"},
  )
  return {"files": files}
