"""Executor for downloading and processing YouTube media via yt-dlp."""

from __future__ import annotations

import json
import tempfile
from pathlib import Path
from typing import Literal

from app.errors import ExecutionError
from app.jobs.model import Job
from app.jobs.schemas import JobExecutionResult, JobOutputFile
from app.utils.files import (
  append_name_suffix,
  cleanup_directory,
  detect_new_file,
  safe_rmtree,
  snapshot_files,
)
from app.worker.cancellation import CancellationToken
from app.worker.process import run_capture, run_process


class NoxtubizerExecutor:
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

  def __init__(self, *, work_root: Path | None = None) -> None:
    self.work_root = work_root

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
      raise ExecutionError("A YouTube URL is required")

    output_dir = Path(
      tempfile.mkdtemp(
        prefix="noxtubizer_",
        dir=str(self.work_root) if self.work_root else None,
      )
    )

    try:
      meta = self._probe(url, cancel_token)
      raw_title = meta.get("title") or job.input_filename or url
      safe_title = self._sanitize(raw_title)

      outputs: list[str] = []
      output_files: list[JobOutputFile] = []
      summary = {
        "mode": mode,
        "title": raw_title,
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
        output_files.append(
          JobOutputFile(
            path=audio_path,
            type="audio",
            name=audio_path.name,
            format=audio_meta.get("format"),
            quality=audio_meta.get("quality"),
            label="Audio",
          )
        )

      if mode in ("video", "both"):
        video_path, video_meta = self._process_video(
          output_dir,
          url,
          safe_title,
          params,
          cancel_token,
        )
        outputs.append(video_path.name)
        output_files.append(
          JobOutputFile(
            path=video_path,
            type="video",
            name=video_path.name,
            format=video_meta.get("format"),
            quality=video_meta.get("quality"),
            label="Video",
          )
        )

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
        output_files = [
          JobOutputFile(
            path=final_path,
            type="video",
            name=final_path.name,
            format=both_meta.get("format"),
            quality=params.get("video_quality"),
            label="Both",
          )
        ]

      cleanup_directory(output_dir, outputs)

      return JobExecutionResult(
        summary=summary,
        output_files=output_files,
        cleanup_paths=[output_dir],
      )
    except Exception:
      safe_rmtree(output_dir)
      raise

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

    before = snapshot_files(output_dir)

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

    run_process(cmd, cancel_token=cancel_token)

    created = detect_new_file(output_dir, before, "Audio")
    final_name = append_name_suffix(f"{title}.{fmt}", "audio", strip_known=True)
    final = output_dir / final_name
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

    before = snapshot_files(output_dir)

    selector = self._video_selector(quality)
    cmd = [
      "yt-dlp",
      "-f", selector,
      "-o", str(output_dir / "%(id)s.%(ext)s"),
      url,
    ]

    run_process(cmd, cancel_token=cancel_token)

    created = detect_new_file(output_dir, before, "Video")
    final_name = append_name_suffix(f"{title}.{fmt}", "video", strip_known=True)
    final = output_dir / final_name

    if created.suffix.lstrip(".") == fmt:
      created.rename(final)
    else:
      run_process([
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

    final_name = append_name_suffix(f"{title}.{fmt}", "both", strip_known=True)
    final = output_dir / final_name

    run_process([
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
      raise ExecutionError("Mode must be one of: audio, video, both")
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
    proc = run_capture(
      ["yt-dlp", "-j", "--skip-download", "--no-warnings", "--ignore-errors", url],
      cancel_token=cancel_token,
    )
    try:
      return json.loads(proc.stdout.splitlines()[0])
    except Exception:
      return {}

  def _probe_video_height(self, path: Path) -> int | None:
    proc = run_capture([
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
    proc = run_capture([
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
