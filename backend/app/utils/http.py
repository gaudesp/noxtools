"""HTTP response helpers."""

from __future__ import annotations

from mimetypes import guess_type
from pathlib import Path

from fastapi.responses import FileResponse


def file_response(path: Path, *, filename: str | None = None) -> FileResponse:
  """Build a FileResponse with a best-effort media type."""
  media_type, _ = guess_type(path.name)
  return FileResponse(
    path=str(path),
    media_type=media_type or "application/octet-stream",
    filename=filename or path.name,
  )
