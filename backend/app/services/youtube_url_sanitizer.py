"""Utilities for normalizing YouTube URLs."""

from __future__ import annotations

from urllib.parse import parse_qs, urlparse


class YouTubeUrlSanitizer:
  """
  Canonicalize YouTube URLs for single-video processing.

  This keeps playlist/radio handling separate so future support can plug in
  without touching the job orchestration layer.
  """

  WATCH_HOSTS = {"www.youtube.com", "youtube.com", "m.youtube.com"}
  SHORT_HOSTS = {"youtu.be"}

  def canonical_single_video_url(self, raw_url: str) -> str:
    """
    Extract the video id and return a canonical watch URL.

    Args:
      raw_url: User-supplied YouTube URL (may contain extra params).

    Returns:
      Canonical https://www.youtube.com/watch?v=<id> URL.

    Raises:
      ValueError: If no valid video id can be determined.
    """
    parsed = urlparse(raw_url)
    host = (parsed.hostname or "").lower()

    if host not in self.WATCH_HOSTS | self.SHORT_HOSTS:
      raise ValueError("A YouTube URL is required")

    video_id = self._extract_video_id(parsed, host)
    if not video_id:
      raise ValueError("Unable to determine YouTube video id from URL")

    return f"https://www.youtube.com/watch?v={video_id}"

  def _extract_video_id(self, parsed, host: str) -> str | None:
    """
    Extract the video id from supported host patterns.
    """
    if host in self.SHORT_HOSTS:
      candidate = parsed.path.lstrip("/").split("/")[0]
      return candidate or None

    query = parse_qs(parsed.query)
    if "v" in query and query["v"]:
      return query["v"][0]

    path_parts = [p for p in parsed.path.split("/") if p]
    if len(path_parts) >= 2 and path_parts[0] in {"embed", "shorts"}:
      return path_parts[1]

    return None
