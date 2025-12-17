"""Executor for generating depixelization reveal videos from images."""

from __future__ import annotations

import shutil
import subprocess
import tempfile
import time
from pathlib import Path
from typing import Iterable, Tuple

import cv2
import numpy as np
import numpy.typing as npt

from app.models.job import Job
from app.workers.job_worker import CancellationToken, JobCancelled

Frame = npt.NDArray[np.uint8]


class NoxelizerExecutor:
  """
  Build a short depixelization video from a single image.

  Mirrors the Noxsongizer executor contract: validate the input, write outputs
  to a per-job directory under media/outputs, and return the output path and
  generated files for persistence by the service layer.
  """

  ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}

  def __init__(
    self,
    *,
    fps: int = 60,
    duration: float = 15,
    min_pix: int = 1,
    max_pix: int = 120,
    final_hold: float = 0.75,
    codec: str = "mp4v",
    suffix: str = ".mp4",
    base_output: Path | None = None,
  ) -> None:
    """Configure executor defaults and ensure base output directory exists."""
    self.fps = fps
    self.duration = duration
    self.min_pix = min_pix
    self.max_pix = max_pix
    self.final_hold = final_hold
    self.codec = codec
    self.suffix = self._normalize_suffix(suffix)
    self.base_output = base_output or Path("media/noxelizer/outputs")

    self._validate_config()
    self.base_output.mkdir(parents=True, exist_ok=True)

  def execute(self, job: Job, cancel_token: CancellationToken | None = None) -> Tuple[Path, list[str], dict]:
    """
    Generate a depixelization video for the job's input image.

    Args:
      job: Job with an image input_path.

    Returns:
      Tuple of (output_dir, output_files, result_metadata).
    """
    if cancel_token:
      cancel_token.raise_if_cancelled()

    if not job.input_path:
      raise ValueError("Input file is missing")

    input_file = Path(job.input_path)
    self._validate_input_file(input_file)

    output_dir = self.base_output / job.id
    output_dir.mkdir(parents=True, exist_ok=True)

    output_filename = self._build_output_name(input_file)
    final_path = output_dir / output_filename

    tmp_file = tempfile.NamedTemporaryFile(dir=output_dir, suffix=self.suffix, delete=False)
    temp_path = Path(tmp_file.name)
    tmp_file.close()
    frames_written = 0
    try:
      frames_written = self._render_video(input_file, temp_path, cancel_token=cancel_token)
      if frames_written <= 0:
        raise RuntimeError("No frames were written to the video")
      temp_path.replace(final_path)
    except Exception:
      try:
        if temp_path.exists():
          temp_path.unlink()
      except Exception:
        pass
      raise

    result = {
      "video": output_filename,
      "frames_written": frames_written,
      "fps": self.fps,
      "duration": self.duration,
      "final_hold": self.final_hold,
      "codec": self.codec,
    }
    return output_dir, [output_filename], result

  def _validate_config(self) -> None:
    """Validate constructor parameters for sane ranges."""
    if self.fps <= 0:
      raise ValueError("fps must be positive")
    if self.duration <= 0:
      raise ValueError("duration must be positive")
    if self.min_pix < 1 or self.max_pix < 1:
      raise ValueError("pixel sizes must be >= 1")
    if self.max_pix < self.min_pix:
      raise ValueError("max_pix must be >= min_pix")
    if self.final_hold < 0:
      raise ValueError("final_hold must be non-negative")
    if not self.codec or len(self.codec) < 4:
      raise ValueError("codec must be a valid fourcc string")

  def _validate_input_file(self, path: Path) -> None:
    """Ensure the input exists and is a supported image extension."""
    if not path.exists():
      raise ValueError("Input file not found on disk")
    if path.suffix.lower() not in self.ALLOWED_EXTENSIONS:
      raise ValueError(f"Unsupported image extension: {path.suffix}")

  def _build_output_name(self, input_file: Path) -> str:
    """Derive the output filename from the input image stem."""
    stem = input_file.stem or "noxelizer_output"
    return f"[Pixelate] {stem}{self.suffix}"

  def _render_video(
    self,
    image_path: Path,
    output_path: Path,
    cancel_token: CancellationToken | None = None,
  ) -> int:
    image = cv2.imread(str(image_path))
    if image is None:
      raise ValueError("Unable to read input image")

    height, width = image.shape[:2]
    if height == 0 or width == 0:
      raise ValueError("Input image has invalid dimensions")

    animated_frames = max(1, round(self.fps * self.duration))
    hold_frames = max(0, round(self.fps * self.final_hold))

    if cancel_token:
      cancel_token.raise_if_cancelled()

    if self._has_ffmpeg():
      return self._render_with_ffmpeg(
        image,
        output_path,
        animated_frames,
        hold_frames,
        cancel_token=cancel_token,
      )
    return self._render_with_cv2(
      image,
      output_path,
      animated_frames,
      hold_frames,
      cancel_token=cancel_token,
    )

  def _generate_frames(
    self,
    image: Frame,
    frame_count: int,
    cancel_token: CancellationToken | None = None,
  ) -> Iterable[Frame]:
    """Yield progressively sharper pixelated frames over the requested count."""
    if frame_count <= 1:
      yield self._pixelate(image, self.min_pix)
      return

    for idx in range(frame_count):
      if cancel_token:
        cancel_token.raise_if_cancelled()
      progress = idx / (frame_count - 1)
      pixel_value = round(self.max_pix - (self.max_pix - self.min_pix) * progress)
      pixel_value = max(1, min(self.max_pix, max(self.min_pix, pixel_value)))
      yield self._pixelate(image, pixel_value)

  def _pixelate(self, image: Frame, pixel_size: int) -> Frame:
    """Pixelate the image at the given block size using nearest-neighbor scaling."""
    if pixel_size <= 1:
      return image

    height, width = image.shape[:2]
    small_w = max(1, width // pixel_size)
    small_h = max(1, height // pixel_size)

    downscaled = cv2.resize(image, (small_w, small_h), interpolation=cv2.INTER_NEAREST)
    return cv2.resize(downscaled, (width, height), interpolation=cv2.INTER_NEAREST)

  def _normalize_suffix(self, suffix: str) -> str:
    """Return a suffix that always starts with a dot."""
    return suffix if suffix.startswith(".") else f".{suffix}"

  def _has_ffmpeg(self) -> bool:
    """Return True if ffmpeg is available on PATH."""
    return shutil.which("ffmpeg") is not None

  def _render_with_ffmpeg(
    self,
    image: Frame,
    output_path: Path,
    animated_frames: int,
    hold_frames: int,
    cancel_token: CancellationToken | None = None,
  ) -> int:
    """
    Render frames to disk and encode with ffmpeg using H.264 (yuv420p).

    Ensures even dimensions for codec compatibility.
    """
    frames_dir = Path(tempfile.mkdtemp(prefix="frames_", dir=output_path.parent))
    frames_written = 0
    try:
      for idx, frame in enumerate(self._generate_frames(image, animated_frames, cancel_token=cancel_token)):
        frame_path = frames_dir / f"frame_{idx:05d}.png"
        if not cv2.imwrite(str(frame_path), frame):
          raise RuntimeError("Failed to write frame to disk")
        frames_written += 1

      for i in range(hold_frames):
        if cancel_token:
          cancel_token.raise_if_cancelled()
        frame_path = frames_dir / f"frame_{frames_written + i:05d}.png"
        if not cv2.imwrite(str(frame_path), image):
          raise RuntimeError("Failed to write final hold frame")
        frames_written += 1

      cmd = [
        "ffmpeg",
        "-y",
        "-framerate",
        str(self.fps),
        "-i",
        str(frames_dir / "frame_%05d.png"),
        "-vf",
        "scale=trunc(iw/2)*2:trunc(ih/2)*2",
        "-c:v",
        "libx264",
        "-preset",
        "fast",
        "-crf",
        "18",
        "-pix_fmt",
        "yuv420p",
        "-movflags",
        "+faststart",
        str(output_path),
      ]
      if cancel_token:
        cancel_token.raise_if_cancelled()

      completed = self._run_with_cancellation(cmd, cancel_token)
      if completed.returncode != 0:
        stderr = (completed.stderr or "").strip()
        raise RuntimeError(stderr or "ffmpeg failed to encode video")
      self.codec = "h264"
      return frames_written
    finally:
      try:
        shutil.rmtree(frames_dir)
      except Exception:
        pass

  def _render_with_cv2(
    self,
    image: Frame,
    output_path: Path,
    animated_frames: int,
    hold_frames: int,
    cancel_token: CancellationToken | None = None,
  ) -> int:
    """Encode video directly with OpenCV when ffmpeg is unavailable."""
    fourcc = cv2.VideoWriter_fourcc(*self.codec)
    writer = cv2.VideoWriter(str(output_path), fourcc, self.fps, (image.shape[1], image.shape[0]))
    if not writer.isOpened():
      raise RuntimeError("Failed to open video writer (codec/extension mismatch?)")

    frames_written = 0
    try:
      for frame in self._generate_frames(image, animated_frames, cancel_token=cancel_token):
        if cancel_token:
          cancel_token.raise_if_cancelled()
        writer.write(frame)
        frames_written += 1
      for _ in range(hold_frames):
        if cancel_token:
          cancel_token.raise_if_cancelled()
        writer.write(image)
        frames_written += 1
    finally:
      writer.release()
    return frames_written

  def _run_with_cancellation(
    self,
    cmd: list[str],
    cancel_token: CancellationToken | None = None,
  ) -> subprocess.CompletedProcess[str]:
    proc = subprocess.Popen(
      cmd,
      stdout=subprocess.PIPE,
      stderr=subprocess.PIPE,
      text=True,
    )

    try:
      while True:
        if cancel_token and cancel_token.cancelled:
          proc.terminate()
          try:
            proc.wait(timeout=5)
          except Exception:
            proc.kill()
          raise JobCancelled()

        retcode = proc.poll()
        if retcode is not None:
          stdout, stderr = proc.communicate()
          return subprocess.CompletedProcess(cmd, retcode, stdout, stderr)

        time.sleep(0.25)
    finally:
      if cancel_token and cancel_token.stopped and proc.poll() is None:
        try:
          proc.terminate()
        except Exception:
          pass
