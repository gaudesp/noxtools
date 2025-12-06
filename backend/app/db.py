from __future__ import annotations

import os
from pathlib import Path
from typing import Generator

from sqlmodel import Session, SQLModel, create_engine

from app.models.job import Job  # noqa: F401


DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./noxtools.db")

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

if DATABASE_URL.startswith("sqlite:///"):
  db_path = DATABASE_URL.replace("sqlite:///", "", 1)
  Path(db_path).parent.mkdir(parents=True, exist_ok=True)

engine = create_engine(
  DATABASE_URL,
  echo=False,
  connect_args=connect_args,
)


def init_db() -> None:
  SQLModel.metadata.create_all(engine)


def get_session() -> Generator[Session, None, None]:
  with Session(engine) as session:
    yield session
