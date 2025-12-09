"""Placeholder routes for the Noxelizer tool."""

from fastapi import APIRouter

router = APIRouter(prefix="/api/noxelizer", tags=["noxelizer"])


@router.get("/health")
def health() -> dict:
  """Health check for the Noxelizer tool."""
  return {"status": "ok", "service": "noxelizer"}
