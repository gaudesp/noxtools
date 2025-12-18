"""Shared types for job execution between workers and services."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any


@dataclass
class JobExecutionResult:
  """Normalized output payload returned by executors."""

  output_path: Path
  output_files: list[str]
  result: dict[str, Any] | None = None
