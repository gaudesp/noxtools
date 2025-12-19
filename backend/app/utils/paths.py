"""Filesystem path helpers for tool media."""

from __future__ import annotations

from pathlib import Path

from app.jobs.model import JobTool

MEDIA_ROOT = Path("media")


def tool_media_base(tool: JobTool) -> Path:
  """Base folder for a tool's media."""
  return MEDIA_ROOT / tool.value


def upload_base(tool: JobTool) -> Path:
  """Upload base directory for a tool."""
  return tool_media_base(tool) / "uploads"


def output_base(tool: JobTool) -> Path:
  """Output base directory for a tool."""
  return tool_media_base(tool) / "outputs"


def ensure_tool_dirs(tool: JobTool) -> tuple[Path, Path]:
  """Ensure upload/output directories exist for a tool."""
  uploads = upload_base(tool)
  outputs = output_base(tool)
  uploads.mkdir(parents=True, exist_ok=True)
  outputs.mkdir(parents=True, exist_ok=True)
  return uploads, outputs
