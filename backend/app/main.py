from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import noxsongizer, noxelizer

app = FastAPI(title="Noxtools API")

# Autoriser le front localhost:5173
origins = [
  "http://localhost:5173",
]

app.add_middleware(
  CORSMiddleware,
  allow_origins=origins,
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)

app.include_router(noxsongizer.router, prefix="/api/noxsongizer", tags=["noxsongizer"])
app.include_router(noxelizer.router, prefix="/api/noxelizer", tags=["noxelizer"])
