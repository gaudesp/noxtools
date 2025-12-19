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
  files = validate_uploads(
    payload.files,
    allowed_extensions=IMAGE_EXTENSIONS,
    allowed_mime_prefixes={"image/"},
  )

  if payload.fps is not None and payload.fps < 1:
    raise ValidationError("FPS must be greater than 0")
  if payload.duration is not None and payload.duration <= 0:
    raise ValidationError("Duration must be greater than 0")
  if payload.final_hold is not None and payload.final_hold < 0:
    raise ValidationError("Final hold must be 0 or greater")

  params = payload.model_dump(exclude_none=True)
  params["files"] = files
  return params
