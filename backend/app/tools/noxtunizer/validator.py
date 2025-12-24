"""Validation helpers for Noxtunizer requests."""

from __future__ import annotations

from app.errors import ValidationError
from app.tools.noxtunizer.schemas import NoxtunizerJobRequest
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


def validate_request(payload: NoxtunizerJobRequest) -> dict:
  """Validate Noxtunizer uploads and return params."""
  has_files = bool(payload.files)
  has_file_ids = bool(payload.file_ids)

  if has_files and has_file_ids:
    raise ValidationError("Provide either files or file_ids, not both")
  if not has_files and not has_file_ids:
    raise ValidationError("Files or file_ids are required")

  if has_file_ids:
    cleaned = [
      file_id.strip() for file_id in payload.file_ids if file_id and file_id.strip()
    ]
    if not cleaned:
      raise ValidationError("At least one file_id is required")
    return {"file_ids": cleaned}

  files = validate_uploads(
    payload.files,
    allowed_extensions=AUDIO_EXTENSIONS,
    allowed_mime_prefixes={"audio/"},
  )
  return {"files": files}
