"""Validation helpers for Noxelizer requests."""

from __future__ import annotations

from app.errors import ValidationError
from app.tools.noxelizer.schemas import NoxelizerJobRequest
from app.utils.uploads import validate_uploads

IMAGE_EXTENSIONS = {
  "png",
  "jpg",
  "jpeg",
  "webp",
  "bmp",
  "gif",
  "tiff",
  "tif",
}


def validate_request(payload: NoxelizerJobRequest) -> dict:
  """Validate Noxelizer uploads and return params."""
  has_files = bool(payload.files)
  has_file_ids = bool(payload.file_ids)

  if has_files and has_file_ids:
    raise ValidationError("Provide either files or file_ids, not both")
  if not has_files and not has_file_ids:
    raise ValidationError("Files or file_ids are required")

  if payload.fps is not None and payload.fps < 1:
    raise ValidationError("FPS must be greater than 0")
  if payload.duration is not None and payload.duration <= 0:
    raise ValidationError("Duration must be greater than 0")
  if payload.final_hold is not None and payload.final_hold < 0:
    raise ValidationError("Final hold must be 0 or greater")

  params = payload.model_dump(exclude_none=True)

  if has_file_ids:
    cleaned = [
      file_id.strip() for file_id in payload.file_ids if file_id and file_id.strip()
    ]
    if not cleaned:
      raise ValidationError("At least one file_id is required")
    params["file_ids"] = cleaned
    params.pop("files", None)
    return params

  files = validate_uploads(
    payload.files,
    allowed_extensions=IMAGE_EXTENSIONS,
    allowed_mime_prefixes={"image/"},
  )
  params["files"] = files
  params.pop("file_ids", None)
  return params
