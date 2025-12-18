"""Executor for downloading and processing YouTube media via yt-dlp."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Literal

from app.executors.base import BaseExecutor
from app.models.job import Job
from app.workers.job_worker import CancellationToken
from app.workers.job_types import JobExecutionResult


class NoxtubizerExecutor(BaseExecutor):
  """
  yt-dlp + ffmpeg based executor.

  Modes:
  - audio
  - video
  - both (merge audio + video)
  """

  AUDIO_QUALITIES = {
    "high": None,
    "320kbps": "320K",
    "256kbps": "256K",
    "128kbps": "128K",
    "64kbps": "64K",
  }

  VIDEO_HEIGHTS = {
    "best": None,
    "4320p": 4320,
    "2160p": 2160,
    "1440p": 1440,
    "1080p": 1080,
    "720p": 720,
    "480p": 480,
    "360p": 360,
    "240p": 240,
  }

  def __init__(self, *, base_output: Path | None = None) -> None:
    super().__init__(base_output=base_output or Path("media/noxtubizer/outputs"))

  def execute(
    self,
    job: Job,
    *,
    cancel_token: CancellationToken | None = None,
  ) -> JobExecutionResult:
    params = job.params or {}

    url = str(params.get("url") or "").strip()
    mode = self._normalize_mode(params.get("mode"))

    if not url:
      raise ValueError("URL is required")

    output_dir = self.prepare_output_dir(job)

    meta = self._probe(url, cancel_token)
    raw_title = meta.get("title") or job.input_filename or url
    safe_title = self._sanitize(raw_title)

    outputs: list[str] = []
    result: dict = {
      "mode": mode,
      "source_title": raw_title,
      "safe_title": safe_title,
      "url": url,
    }

    audio_path = None
    video_path = None

    if mode in ("audio", "both"):
      audio_path, audio_meta = self._process_audio(
        output_dir,
        url,
        safe_title,
        params,
        cancel_token,
      )
      outputs.append(audio_path.name)
      result["audio"] = audio_meta

    if mode in ("video", "both"):
      video_path, video_meta = self._process_video(
        output_dir,
        url,
        safe_title,
        params,
        cancel_token,
      )
      outputs.append(video_path.name)
      result["video"] = video_meta

    if mode == "both":
      final_path, both_meta = self._merge_audio_video(
        output_dir,
        audio_path,
        video_path,
        safe_title,
        params,
        cancel_token,
      )
      outputs = [final_path.name]
      result["both"] = both_meta

    self.cleanup_directory(output_dir, outputs)

    return JobExecutionResult(
      output_path=output_dir,
      output_files=outputs,
      result=result,
    )

  def _process_audio(
    self,
    output_dir: Path,
    url: str,
    title: str,
    params: dict,
    cancel_token: CancellationToken | None,
  ) -> tuple[Path, dict]:
    quality = params.get("audio_quality", "high")
    fmt = params.get("audio_format", "mp3")

    before = self.snapshot(output_dir)

    cmd = [
      "yt-dlp",
      "--extract-audio",
      "--audio-format", self._map_audio_format(fmt),
      "-o", str(output_dir / "%(id)s.%(ext)s"),
      url,
    ]

    bitrate = self.AUDIO_QUALITIES.get(quality)
    if fmt != "wav" and bitrate:
      cmd.extend(["--audio-quality", bitrate])

    self.run_process(cmd, cancel_token=cancel_token)

    created = self.detect_new_file(output_dir, before, "Audio")
    final = output_dir / f"[Audio] {title}.{fmt}"
    created.rename(final)

    return final, {
      "filename": final.name,
      "format": fmt,
      "quality": quality,
      "real_bitrate": self._probe_audio_bitrate(final),
    }

  def _process_video(
    self,
    output_dir: Path,
    url: str,
    title: str,
    params: dict,
    cancel_token: CancellationToken | None,
  ) -> tuple[Path, dict]:
    quality = params.get("video_quality", "best")
    fmt = params.get("video_format", "mp4")

    before = self.snapshot(output_dir)

    selector = self._video_selector(quality)
    cmd = [
      "yt-dlp",
      "-f", selector,
      "-o", str(output_dir / "%(id)s.%(ext)s"),
      url,
    ]

    self.run_process(cmd, cancel_token=cancel_token)

    created = self.detect_new_file(output_dir, before, "Video")
    final = output_dir / f"[Video] {title}.{fmt}"

    if created.suffix.lstrip(".") == fmt:
      created.rename(final)
    else:
      self.run_process([
        "ffmpeg", "-y",
        "-i", str(created),
        "-c:v", "copy",
        "-an",
        str(final),
      ], cancel_token=cancel_token)

    return final, {
      "filename": final.name,
      "format": fmt,
      "quality": quality,
      "real_height": self._probe_video_height(final),
    }

  def _merge_audio_video(
    self,
    output_dir: Path,
    audio: Path,
    video: Path,
    title: str,
    params: dict,
    cancel_token: CancellationToken | None,
  ) -> tuple[Path, dict]:
    fmt = params.get("video_format", "mp4")
    audio_fmt = params.get("audio_format", "mp3")

    final = output_dir / f"[Both] {title}.{fmt}"

    self.run_process([
      "ffmpeg", "-y",
      "-i", str(video),
      "-i", str(audio),
      "-c:v", "copy",
      "-c:a", self._audio_codec(audio_fmt, fmt),
      "-map", "0:v:0",
      "-map", "1:a:0",
      str(final),
    ], cancel_token=cancel_token)

    return final, {
      "filename": final.name,
      "format": fmt,
      "audio_format": audio_fmt,
      "real_height": self._probe_video_height(final),
      "real_bitrate": self._probe_audio_bitrate(final),
    }

  def _normalize_mode(self, mode: str | None) -> Literal["audio", "video", "both"]:
    mode = str(mode or "").lower()
    if mode not in ("audio", "video", "both"):
      raise ValueError("Mode must be: audio | video | both")
    return mode

  def _sanitize(self, title: str) -> str:
    clean = "".join(ch if ch.isalnum() or ch in (" ", "-", "_") else "_" for ch in title)
    return clean.strip(" _") or "noxtubizer"

  def _video_selector(self, quality: str) -> str:
    height = self.VIDEO_HEIGHTS.get(quality)
    if height:
      return f"bestvideo[height<={height}]/bestvideo"
    return "bestvideo/best"

  def _map_audio_format(self, fmt: str) -> str:
    return "vorbis" if fmt == "ogg" else fmt

  def _audio_codec(self, audio_fmt: str, container: str) -> str:
    if container == "mp4" and audio_fmt in ("wav", "ogg"):
      return "aac"

    return {
      "mp3": "libmp3lame",
      "m4a": "aac",
      "ogg": "libvorbis",
      "wav": "pcm_s16le",
    }.get(audio_fmt, "copy")

  def _probe(self, url: str, cancel_token: CancellationToken | None) -> dict:
    proc = self.run_capture(
      ["yt-dlp", "-j", "--skip-download", "--no-warnings", "--ignore-errors", url],
      cancel_token=cancel_token,
    )
    try:
      return json.loads(proc.stdout.splitlines()[0])
    except Exception:
      return {}

  def _probe_video_height(self, path: Path) -> int | None:
    proc = self.run_capture([
      "ffprobe", "-v", "error",
      "-select_streams", "v:0",
      "-show_entries", "stream=height",
      "-of", "json",
      str(path),
    ])
    try:
      return json.loads(proc.stdout)["streams"][0]["height"]
    except Exception:
      return None

  def _probe_audio_bitrate(self, path: Path) -> int | None:
    proc = self.run_capture([
      "ffprobe", "-v", "error",
      "-select_streams", "a:0",
      "-show_entries", "stream=bit_rate",
      "-of", "json",
      str(path),
    ])
    try:
      bps = json.loads(proc.stdout)["streams"][0]["bit_rate"]
      return int(int(bps) / 1000) if bps else None
    except Exception:
      return None
