"""Application error types for consistent HTTP mapping."""

from __future__ import annotations


class AppError(Exception):
  """Base error with HTTP-friendly metadata."""

  status_code = 500
  default_detail = "Internal Server Error"

  def __init__(self, detail: str | None = None) -> None:
    self.detail = detail or self.default_detail
    super().__init__(self.detail)


class ValidationError(AppError):
  """Input validation error."""

  status_code = 400
  default_detail = "Invalid request"


class NotFoundError(AppError):
  """Missing resource error."""

  status_code = 404
  default_detail = "Not found"


class ConflictError(AppError):
  """State conflict error."""

  status_code = 409
  default_detail = "Conflict"


class StorageError(AppError):
  """Filesystem persistence error."""

  status_code = 500
  default_detail = "Storage error"


class ExecutionError(AppError):
  """Execution pipeline failure."""

  status_code = 500
  default_detail = "Execution failed"
