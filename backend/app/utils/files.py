"""Generic filesystem helpers."""

from __future__ import annotations

import shutil
from pathlib import Path
from typing import Iterable

from app.errors import ExecutionError


KNOWN_SUFFIXES = (
  "_audio",
  "_video",
  "_both",
  "_image",
  "_pixelate",
  "_vocals",
  "_other",
  "_bass",
  "_drums",
)


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


def _normalize_suffix_token(suffix: str) -> str:
  cleaned = str(suffix or "").strip()
  if not cleaned:
    return ""
  return cleaned if cleaned.startswith("_") else f"_{cleaned}"


def strip_known_suffix_from_stem(
  stem: str,
  suffixes: Iterable[str] = KNOWN_SUFFIXES,
) -> str:
  """Remove a known technical suffix from a filename stem."""
  lower = stem.lower()
  for suffix in suffixes:
    if lower.endswith(suffix.lower()):
      return stem[: -len(suffix)]
  return stem


def strip_known_suffix(
  name: str,
  suffixes: Iterable[str] = KNOWN_SUFFIXES,
) -> str:
  """Strip a known suffix from a filename (preserves extension)."""
  path = Path(name)
  cleaned_stem = strip_known_suffix_from_stem(path.stem, suffixes)
  return f"{cleaned_stem}{path.suffix}"


def append_name_suffix(
  name: str,
  suffix: str,
  *,
  strip_known: bool = False,
) -> str:
  """Append a suffix before the extension unless already present."""
  if not name:
    return name
  token = _normalize_suffix_token(suffix)
  if not token:
    return name
  path = Path(name)
  stem = strip_known_suffix_from_stem(path.stem) if strip_known else path.stem
  if stem.lower().endswith(token.lower()):
    return name
  return f"{stem}{token}{path.suffix}"


def build_download_name(name: str, label: str | None) -> str:
  """Build a download filename using an optional label prefix."""
  if not label:
    return name
  cleaned = str(label).strip()
  if not cleaned:
    return name
  safe_name = strip_known_suffix(name)
  return f"[{cleaned}] {safe_name}"
