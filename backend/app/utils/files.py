"""Generic filesystem helpers."""

from __future__ import annotations

import shutil
from pathlib import Path
from typing import Iterable

from app.errors import ExecutionError


def ensure_path(
  path: str | Path | None,
  *,
  missing_message: str,
  not_found_message: str,
) -> Path:
  """Resolve a path and raise with explicit messages when missing."""
  if not path:
    raise ExecutionError(missing_message)
  resolved = Path(path)
  if not resolved.exists():
    raise ExecutionError(not_found_message)
  return resolved


def snapshot_files(directory: Path) -> set[Path]:
  """Snapshot current files in a directory."""
  if not directory.exists():
    return set()
  return {path for path in directory.iterdir() if path.is_file()}


def detect_new_file(directory: Path, before: set[Path], label: str) -> Path:
  """Detect exactly one new file in a directory."""
  after = snapshot_files(directory)
  created = list(after - before)

  if not created:
    raise ExecutionError(f"No {label} file was created")
  if len(created) > 1:
    raise ExecutionError(f"Multiple {label} files were created")

  return created[0]


def cleanup_directory(directory: Path, keep: Iterable[str]) -> None:
  """Remove files in a directory except for the kept filenames."""
  keep_set = set(keep)
  if not directory.exists():
    return

  for path in directory.iterdir():
    if not path.is_file():
      continue
    if path.name not in keep_set:
      try:
        path.unlink()
      except Exception:
        pass


def safe_rmtree(path: Path) -> None:
  """Best-effort directory removal."""
  try:
    if path.exists():
      shutil.rmtree(path)
  except Exception:
    pass


def safe_unlink(path: Path) -> None:
  """Best-effort file removal."""
  try:
    if path.exists():
      path.unlink()
  except Exception:
    pass
