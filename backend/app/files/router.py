"""FastAPI routes for file library operations."""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response
from sqlmodel import Session

from app.db import get_session
from app.errors import NotFoundError, ValidationError
from app.files.schemas import PaginatedFiles
from app.files.service import FileService
from app.utils.http import file_response
from app.utils.images import build_image_variant

router = APIRouter(prefix="/api/files", tags=["files"], redirect_slashes=False)


def get_file_service(session: Session = Depends(get_session)) -> FileService:
  """Dependency injector for FileService."""
  return FileService(session)


@router.get("", response_model=PaginatedFiles)
def list_files(
  q: Optional[str] = Query(
    default=None,
    description="Search by name, type, or label.",
  ),
  file_type: Optional[str] = Query(
    default=None,
    alias="type",
    description="Filter by file type.",
  ),
  limit: int = Query(default=50, ge=1, le=200),
  offset: int = Query(default=0, ge=0),
  file_service: FileService = Depends(get_file_service),
) -> PaginatedFiles:
  """List stored files with optional search and type filters."""
  items = file_service.list_files(
    file_type=file_type,
    query=q,
    limit=limit,
    offset=offset,
  )
  total = file_service.count_files(file_type=file_type, query=q)
  return PaginatedFiles(items=items, total=total, limit=limit, offset=offset)


@router.get("/{file_id}/content")
def download_file_content(
  file_id: str,
  variant: Optional[str] = Query(
    None,
    description="Optional image variant (e.g. thumb). Defaults to original file.",
  ),
  file_service: FileService = Depends(get_file_service),
) -> Response:
  """Stream a file (or image variant) by id."""
  file = file_service.repo.get(file_id)
  if not file:
    raise NotFoundError("File not found")

  path = file_service.resolve_path(file)
  if not path.exists() or not path.is_file():
    raise NotFoundError("File not found")

  if variant:
    if file.type != "image":
      raise ValidationError("Image variants are only supported for image files")
    rendered = build_image_variant(path, variant=variant)
    if rendered:
      content, media_type = rendered
      return Response(content=content, media_type=media_type)

  return file_response(path, filename=file.name)
