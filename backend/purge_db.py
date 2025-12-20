#!/usr/bin/env python
"""
Reset the Noxtools backend state:
- Drop and recreate all SQLModel tables using the configured DATABASE_URL.
- Delete stored file data under the File storage root.

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
from app.files import model as file_model  # noqa: F401
from app.files.storage import DEFAULT_STORAGE_ROOT
from app.jobs import file_links as job_file_links  # noqa: F401
from app.jobs import model as job_model  # noqa: F401


def purge_database() -> None:
  url = os.getenv("DATABASE_URL", DATABASE_URL)
  engine = create_engine(url, echo=False, connect_args={"check_same_thread": False} if url.startswith("sqlite") else {})
  SQLModel.metadata.drop_all(engine)
  SQLModel.metadata.create_all(engine)
  print(f"Database reset at {url}")


def purge_storage() -> None:
  path = Path(DEFAULT_STORAGE_ROOT)
  try:
    if path.exists():
      shutil.rmtree(path)
      print(f"Removed {path}")
  except Exception as exc:  # noqa: BLE001
    print(f"Failed to remove {path}: {exc}")


if __name__ == "__main__":
  purge_database()
  purge_storage()
