"""YouTube URL normalization helpers."""

from __future__ import annotations

from urllib.parse import parse_qs, urlparse

from app.errors import ValidationError


def canonicalize_youtube_url(raw_url: str) -> str:
  """
  Extract the video id and return a canonical watch URL.

  Raises:
    ValidationError: If no valid video id can be determined.
  """
  parsed = urlparse(raw_url)
  host = (parsed.hostname or "").lower()

  watch_hosts = {"www.youtube.com", "youtube.com", "m.youtube.com"}
  short_hosts = {"youtu.be"}

  if host not in watch_hosts | short_hosts:
    raise ValidationError("A YouTube URL is required")

  video_id = _extract_video_id(parsed, host, short_hosts)
  if not video_id:
    raise ValidationError("Unable to determine YouTube video id from URL")

  return f"https://www.youtube.com/watch?v={video_id}"


def _extract_video_id(parsed, host: str, short_hosts: set[str]) -> str | None:
  if host in short_hosts:
    candidate = parsed.path.lstrip("/").split("/")[0]
    return candidate or None

  query = parse_qs(parsed.query)
  if "v" in query and query["v"]:
    return query["v"][0]

  path_parts = [p for p in parsed.path.split("/") if p]
  if len(path_parts) >= 2 and path_parts[0] in {"embed", "shorts"}:
    return path_parts[1]

  return None
