from fastapi import APIRouter

router = APIRouter(prefix="/api/noxelizer", tags=["noxelizer"])

@router.get("/health")
def health() -> dict:
  return {"status": "ok", "service": "noxelizer"}
