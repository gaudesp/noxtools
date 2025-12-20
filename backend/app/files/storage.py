"""Filesystem storage helpers for File entities."""

from __future__ import annotations

import hashlib
import os
import shutil
from pathlib import Path
from typing import BinaryIO

from app.errors import StorageError

DEFAULT_STORAGE_ROOT = Path(os.getenv("NOXTOOLS_FILE_STORAGE_ROOT", "storage/files"))
CHUNK_SIZE = 1024 * 1024


class FileStorage:
  """Handles physical storage for File entities."""

  def __init__(self, root: Path | None = None) -> None:
    self.root = Path(root) if root else DEFAULT_STORAGE_ROOT
    self.root.mkdir(parents=True, exist_ok=True)

  def sanitize_name(self, name: str) -> str:
    """Normalize a filename for safe storage."""
    cleaned = Path(name).name.strip()
    return cleaned or "file"

  def build_relative_path(self, file_id: str, filename: str) -> str:
    """Build the storage-relative path for a file."""
    return str(Path(file_id) / filename)

  def resolve_path(self, relative_path: str) -> Path:
    """Resolve an absolute path under the storage root."""
    return self.root / relative_path

  def hash_stream(self, stream: BinaryIO) -> tuple[str, int]:
    """Compute SHA-256 checksum and size for a stream, then reset to start."""
    if not self._safe_seek(stream, 0):
      raise StorageError("File stream is not seekable")

    hasher = hashlib.sha256()
    size = 0

    while True:
      chunk = stream.read(CHUNK_SIZE)
      if not chunk:
        break
      size += len(chunk)
      hasher.update(chunk)

    if not self._safe_seek(stream, 0):
      raise StorageError("Failed to reset file stream")

    return hasher.hexdigest(), size

  def hash_path(self, path: Path) -> tuple[str, int]:
    """Compute SHA-256 checksum and size for a file on disk."""
    if not path.exists() or not path.is_file():
      raise StorageError("File not found on disk")

    hasher = hashlib.sha256()
    size = 0

    try:
      with path.open("rb") as handle:
        while True:
          chunk = handle.read(CHUNK_SIZE)
          if not chunk:
            break
          size += len(chunk)
          hasher.update(chunk)
    except Exception as exc:
      raise StorageError("Failed to read file for hashing") from exc

    return hasher.hexdigest(), size

  def write_stream(self, dest: Path, stream: BinaryIO) -> None:
    """Persist a stream to the given destination path."""
    dest.parent.mkdir(parents=True, exist_ok=True)
    try:
      with dest.open("wb") as buffer:
        shutil.copyfileobj(stream, buffer)
    except Exception as exc:
      raise StorageError("Failed to write file to storage") from exc

    self._safe_seek(stream, 0)

  def move_path(self, source: Path, dest: Path) -> None:
    """Move a file into storage."""
    dest.parent.mkdir(parents=True, exist_ok=True)
    try:
      shutil.move(str(source), str(dest))
    except Exception as exc:
      raise StorageError("Failed to move file into storage") from exc

  def remove_path(self, path: Path) -> None:
    """Best-effort removal of a stored file and its parent folder."""
    try:
      if path.exists():
        path.unlink()
    except Exception:
      pass

    parent = path.parent
    if parent == self.root:
      return
    if not self._is_within_root(parent):
      return

    try:
      shutil.rmtree(parent, ignore_errors=True)
    except Exception:
      pass

  def _safe_seek(self, stream: BinaryIO, position: int) -> bool:
    try:
      stream.seek(position)
      return True
    except Exception:
      return False

  def _is_within_root(self, path: Path) -> bool:
    try:
      return path.resolve().is_relative_to(self.root.resolve())
    except Exception:
      return False
