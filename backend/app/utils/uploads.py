"""Upload validation helpers."""

from __future__ import annotations

import os
from pathlib import Path
from typing import Iterable

from fastapi import UploadFile

from app.errors import ValidationError


class UploadValidationError(ValidationError):
  """Raised when an uploaded file fails validation."""


def validate_uploads(
  files: Iterable[UploadFile],
  *,
  min_files: int = 1,
  max_files: int | None = None,
  min_file_size: int = 1,
  max_file_size: int | None = None,
  allowed_extensions: set[str] | None = None,
  allowed_mime_prefixes: set[str] | None = None,
) -> list[UploadFile]:
  """
  Validate uploaded files and return a normalized list.

  Raises:
    UploadValidationError: If any validation fails.
  """
  file_list = [file for file in files if file is not None]

  if min_files and len(file_list) < min_files:
    raise UploadValidationError("At least one file is required")

  if max_files is not None and len(file_list) > max_files:
    raise UploadValidationError(f"Too many files (max {max_files})")

  extensions = {ext.lower().lstrip(".") for ext in (allowed_extensions or set())}
  mime_prefixes = {prefix.lower() for prefix in (allowed_mime_prefixes or set())}

  for upload in file_list:
    filename = (upload.filename or "").strip()
    if not filename:
      raise UploadValidationError("File name is required")

    size = _file_size(upload)
    if size < min_file_size:
      raise UploadValidationError(f"File '{filename}' is empty")

    if max_file_size is not None and size > max_file_size:
      max_mb = max_file_size / (1024 * 1024)
      raise UploadValidationError(
        f"File '{filename}' exceeds the maximum size ({max_mb:.1f} MB)"
      )

    if extensions or mime_prefixes:
      ext = Path(filename).suffix.lower().lstrip(".")
      content_type = (upload.content_type or "").lower()
      allowed_by_ext = ext in extensions if extensions else False
      allowed_by_mime = (
        any(content_type.startswith(prefix) for prefix in mime_prefixes)
        if mime_prefixes and content_type
        else False
      )

      if not (allowed_by_ext or allowed_by_mime):
        raise UploadValidationError(f"File '{filename}' type is not supported")

  return file_list


def _file_size(upload: UploadFile) -> int:
  file_obj = upload.file
  try:
    current = file_obj.tell()
  except Exception:
    current = None

  try:
    file_obj.seek(0, os.SEEK_END)
    size = file_obj.tell()
  except Exception:
    size = 0
  finally:
    try:
      if current is None:
        file_obj.seek(0)
      else:
        file_obj.seek(current)
    except Exception:
      pass

  return size
