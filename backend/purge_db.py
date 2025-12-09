#!/usr/bin/env python
"""
Reset the Noxtools backend state:
- Drop and recreate all SQLModel tables using the configured DATABASE_URL.
- Delete job-related media folders (uploads, outputs, separated).

Usage:
  cd backend
  python purge_db.py
"""
from __future__ import annotations

import os
import shutil
from pathlib import Path

from sqlmodel import SQLModel, create_engine

from app.db import DATABASE_URL
from app.models import job  # noqa: F401


def purge_database() -> None:
  url = os.getenv("DATABASE_URL", DATABASE_URL)
  engine = create_engine(url, echo=False, connect_args={"check_same_thread": False} if url.startswith("sqlite") else {})
  SQLModel.metadata.drop_all(engine)
  SQLModel.metadata.create_all(engine)
  print(f"Database reset at {url}")


def purge_media() -> None:
  paths = [
    Path("media/noxsongizer/uploads"),
    Path("media/noxsongizer/outputs"),
    Path("media/noxelizer/uploads"),
    Path("media/noxelizer/outputs"),
    Path("separated"),
  ]
  for path in paths:
    try:
      if path.exists():
        shutil.rmtree(path)
        print(f"Removed {path}")
    except Exception as exc:  # noqa: BLE001
      print(f"Failed to remove {path}: {exc}")


if __name__ == "__main__":
  purge_database()
  purge_media()
