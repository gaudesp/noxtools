"""Clean, stable NoxtubizerExecutor using the yt-dlp CLI."""

from __future__ import annotations

import json
import shutil
import subprocess
import time
from pathlib import Path
from typing import List, Tuple

from app.models.job import Job
from app.workers.job_worker import CancellationToken, JobCancelled


class NoxtubizerExecutor:
  """
  Stable implementation using yt-dlp + ffmpeg.

  AUDIO MODE:
    • download best audio-only stream
    • transcode to requested format (mp3/m4a/ogg/wav)
    • apply bitrate when meaningful (ignored for WAV)

  VIDEO MODE:
    • download best video-only stream according to user’s max height
    • remux to mp4/mkv (copy video, drop audio)

  BOTH MODE:
    • reuse the already-generated audio + video
    • merge into one container (copy video, encode/copy audio depending on format)
    • always produce a single final file

  All temporary yt-dlp/ffmpeg files are removed.
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
    self.base_output = base_output or Path("media/noxtubizer/outputs")
    self.base_output.mkdir(parents=True, exist_ok=True)

  def execute(self, job: Job, cancel_token: CancellationToken | None = None) -> Tuple[Path, List[str], dict]:
    params = job.params or {}
    url = str(params.get("url") or "").strip()
    mode = str(params.get("mode") or "").lower()

    if not url:
      raise ValueError("URL is required")
    if mode not in ("audio", "video", "both"):
      raise ValueError("Mode must be: audio | video | both")

    audio_quality = params.get("audio_quality", "high").lower()
    audio_format = params.get("audio_format", "mp3").lower()
    video_quality = params.get("video_quality", "best").lower()
    video_format = params.get("video_format", "mp4").lower()

    output_dir = self.base_output / job.id
    output_dir.mkdir(parents=True, exist_ok=True)

    meta = self._probe(url, cancel_token=cancel_token)
    raw_title = meta.get("title") or job.input_filename or url
    safe_title = self._sanitize(raw_title)

    outputs: List[str] = []
    result = {
      "mode": mode,
      "source_title": raw_title,
      "safe_title": safe_title,
      "url": url,
    }

    audio_path: Path | None = None
    video_path: Path | None = None

    if cancel_token:
      cancel_token.raise_if_cancelled()

    if mode in ("audio", "both"):
      before = self._snapshot(output_dir)

      temp = output_dir / "%(id)s"
      cli_fmt = self._map_audio_format(audio_format)

      cmd = [
        "yt-dlp",
        "--extract-audio",
        "--audio-format", cli_fmt,
        "-o", str(temp) + ".%(ext)s",
        url,
      ]

      bitrate = self.AUDIO_QUALITIES.get(audio_quality)
      if audio_format != "wav" and bitrate:
        cmd.extend(["--audio-quality", bitrate])

      self._run(cmd, cancel_token=cancel_token)

      created = self._detect_new_file(output_dir, before, "Audio")
      audio_path = output_dir / f"[Audio] {safe_title}.{audio_format}"

      try:
        created.rename(audio_path)
      except Exception:
        audio_path = created

      if mode == "audio":
        outputs.append(audio_path.name)
        result["audio"] = {
          "filename": audio_path.name,
          "format": audio_format,
          "quality": audio_quality,
        }

        result["audio"]["real_bitrate"] = self._probe_audio_bitrate(audio_path)

    if mode in ("video", "both"):
      before = self._snapshot(output_dir)

      temp = output_dir / "%(id)s"
      selector = self._video_selector(video_quality)

      cmd = ["yt-dlp", "-f", selector, "-o", str(temp) + ".%(ext)s", url]
      self._run(cmd, cancel_token=cancel_token)

      created = self._detect_new_file(output_dir, before, "Video")
      created_ext = created.suffix.lstrip(".").lower()

      video_path = output_dir / f"[Video] {safe_title}.{video_format}"

      if created_ext == video_format:
        try:
          created.rename(video_path)
        except Exception:
          video_path = created
      else:
        remux_cmd = [
          "ffmpeg",
          "-y",
          "-i", str(created),
          "-c:v", "copy",
          "-an",
          str(video_path),
        ]
        self._run(remux_cmd, cancel_token=cancel_token)

      if mode == "video":
        outputs.append(video_path.name)
        result["video"] = {
          "filename": video_path.name,
          "format": video_format,
          "quality": video_quality,
        }

        result["video"]["real_height"] = self._probe_video_file(video_path)

    if mode == "both":
      if not audio_path or not video_path:
        raise RuntimeError("Both mode requires audio and video artifacts")

      final_output = output_dir / f"[Both] {safe_title}.{video_format}"
      audio_codec = self._audio_codec(audio_format, video_format)

      merge_cmd = [
        "ffmpeg",
        "-y",
        "-i", str(video_path),
        "-i", str(audio_path),
        "-c:v", "copy",
        "-c:a", audio_codec,
        "-map", "0:v:0",
        "-map", "1:a:0",
        str(final_output),
      ]

      self._run(merge_cmd, cancel_token=cancel_token)

      outputs.append(final_output.name)
      result["both"] = {
        "filename": final_output.name,
        "format": video_format,
        "audio_format": audio_format,
        "audio_quality": audio_quality,
      }

      result["both"]["real_height"] = self._probe_video_file(final_output)
      result["both"]["real_bitrate"] = self._probe_audio_bitrate(final_output)

    keep = []
    if mode == "audio" and audio_path:
      keep = [audio_path]
    elif mode == "video" and video_path:
      keep = [video_path]
    elif mode == "both":
      keep = [final_output]

    self._clean_directory(output_dir, keep)

    return output_dir, outputs, result

  def _probe(self, url: str, cancel_token: CancellationToken | None = None) -> dict:
    cmd = ["yt-dlp", "-j", "--skip-download", "--no-warnings", "--ignore-errors", url]
    proc = self._run_capture(cmd, cancel_token=cancel_token)
    if proc.returncode != 0:
      return {}
    try:
      return json.loads(proc.stdout.splitlines()[0])
    except Exception:
      return {}

  def _run(self, cmd: list[str], cancel_token: CancellationToken | None = None) -> None:
    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    try:
      retcode, _, stderr = self._wait_process(proc, cancel_token)
      if retcode != 0:
        raise RuntimeError((stderr or "").strip() or f"{cmd[0]} failed")
    finally:
      if cancel_token and cancel_token.stopped and proc.poll() is None:
        try:
          proc.terminate()
        except Exception:
          pass

  def _run_capture(self, cmd: list[str], cancel_token: CancellationToken | None = None) -> subprocess.CompletedProcess[str]:
    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    try:
      retcode, stdout, stderr = self._wait_process(proc, cancel_token)
      return subprocess.CompletedProcess(cmd, retcode, stdout, stderr)
    finally:
      if cancel_token and cancel_token.stopped and proc.poll() is None:
        try:
          proc.terminate()
        except Exception:
          pass

  def _wait_process(
    self,
    proc: subprocess.Popen,
    cancel_token: CancellationToken | None = None,
  ) -> tuple[int, str, str]:
    """
    Wait for a subprocess while draining pipes and honoring cancellation.
    """
    stdout = ""
    stderr = ""
    while True:
      if cancel_token and cancel_token.cancelled:
        proc.terminate()
        try:
          proc.wait(timeout=5)
        except Exception:
          proc.kill()
        raise JobCancelled()
      try:
        out, err = proc.communicate(timeout=0.5)
        stdout += out or ""
        stderr += err or ""
        return proc.returncode or 0, stdout, stderr
      except subprocess.TimeoutExpired:
        continue

  def _map_audio_format(self, fmt: str) -> str:
    if fmt == "ogg":
      return "vorbis"
    return fmt

  def _video_selector(self, quality: str) -> str:
    height = self.VIDEO_HEIGHTS.get(quality)
    if height:
      return f"bestvideo[height<={height}]/bestvideo"
    return "bestvideo/best"

  def _audio_codec(self, audio_fmt: str, container: str) -> str:
    audio_fmt = audio_fmt.lower()
    container = container.lower()

    if container == "mp4" and audio_fmt == "wav":
      return "aac"

    if container == "mp4" and audio_fmt == "ogg":
      return "aac"

    codec_map = {
      "mp3": "libmp3lame",
      "m4a": "aac",
      "ogg": "libvorbis",
      "wav": "pcm_s16le",
    }
    return codec_map.get(audio_fmt, "copy")

  def _snapshot(self, directory: Path) -> dict[Path, float]:
    return {p: p.stat().st_mtime for p in directory.glob("*")}

  def _detect_new_file(self, directory: Path, before: dict[Path, float], label: str) -> Path:
    after = {p: p.stat().st_mtime for p in directory.glob("*")}
    created = [p for p, m in after.items() if p not in before or m > before.get(p, 0)]
    if not created:
      raise RuntimeError(f"{label}: yt-dlp produced no output file")
    return max(created, key=lambda p: after[p])

  def _sanitize(self, title: str) -> str:
    clean = "".join(ch if ch.isalnum() or ch in (" ", "-", "_") else "_" for ch in title)
    return clean.strip(" _") or "noxtubizer"

  def _clean_directory(self, directory: Path, keep_paths: list[Path]) -> None:
    keep = {p.resolve() for p in keep_paths}
    for path in directory.iterdir():
      try:
        if path.resolve() in keep:
          continue
        if path.is_dir():
          shutil.rmtree(path, ignore_errors=True)
        else:
          path.unlink(missing_ok=True)
      except Exception:
        pass

  def _probe_video_file(self, path: Path) -> int | None:
    cmd = [
      "ffprobe", "-v", "error",
      "-select_streams", "v:0",
      "-show_entries", "stream=height",
      "-of", "json",
      str(path),
    ]
    proc = subprocess.run(cmd, capture_output=True, text=True)
    if proc.returncode != 0:
      return None
    try:
      data = json.loads(proc.stdout)
      return data.get("streams", [{}])[0].get("height")
    except Exception:
      return None

  def _probe_audio_bitrate(self, path: Path) -> int | None:
    cmd = [
      "ffprobe", "-v", "error",
      "-select_streams", "a:0",
      "-show_entries", "stream=bit_rate",
      "-of", "json",
      str(path),
    ]
    proc = subprocess.run(cmd, capture_output=True, text=True)
    if proc.returncode != 0:
      return None
    try:
      data = json.loads(proc.stdout)
      bps = data.get("streams", [{}])[0].get("bit_rate")
      return int(int(bps) / 1000) if bps else None
    except Exception:
      return None
