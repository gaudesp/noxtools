"""Validation helpers for Noxtubizer requests."""

from __future__ import annotations

from app.errors import ValidationError
from app.tools.noxtubizer.schemas import NoxtubizerJobRequest
from app.utils.youtube import canonicalize_youtube_url

ALLOWED_MODES = {"audio", "video", "both"}
ALLOWED_AUDIO_QUALITIES = {"high", "320kbps", "256kbps", "128kbps", "64kbps"}
ALLOWED_AUDIO_FORMATS = {"mp3", "m4a", "ogg", "wav"}
ALLOWED_VIDEO_QUALITIES = {
  "best",
  "4320p",
  "2160p",
  "1440p",
  "1080p",
  "720p",
  "480p",
  "360p",
  "240p",
}
ALLOWED_VIDEO_FORMATS = {"mp4", "mkv"}


def validate_request(payload: NoxtubizerJobRequest) -> dict:
  """Validate and normalize Noxtubizer inputs for storage."""
  params = payload.model_dump()
  mode = str(params.get("mode") or "").lower()
  params["mode"] = mode

  params["url"] = canonicalize_youtube_url(str(params.get("url") or "").strip())

  if mode not in ALLOWED_MODES:
    raise ValidationError("Mode must be one of: audio, video, both")

  if mode in ("audio", "both"):
    params["audio_quality"] = params.get("audio_quality") or "high"
    params["audio_format"] = params.get("audio_format") or "mp3"
    if params["audio_quality"] not in ALLOWED_AUDIO_QUALITIES:
      raise ValidationError("Invalid audio_quality value")
    if params["audio_format"] not in ALLOWED_AUDIO_FORMATS:
      raise ValidationError("Invalid audio_format value")

  if mode in ("video", "both"):
    params["video_quality"] = params.get("video_quality") or "best"
    params["video_format"] = params.get("video_format") or "mp4"
    if params["video_quality"] not in ALLOWED_VIDEO_QUALITIES:
      raise ValidationError("Invalid video_quality value")
    if params["video_format"] not in ALLOWED_VIDEO_FORMATS:
      raise ValidationError("Invalid video_format value")

  return params
