"""Executor for generating depixelization reveal videos from images."""

from __future__ import annotations

import shutil
import tempfile
from pathlib import Path
from typing import Iterable

import cv2
import numpy as np
import numpy.typing as npt
from PIL import Image, ImageOps

from app.errors import ExecutionError, StorageError
from app.jobs.model import Job
from app.jobs.schemas import JobExecutionResult, JobOutputFile
from app.utils.files import append_name_suffix, ensure_path, safe_rmtree, safe_unlink, strip_known_suffix_from_stem
from app.worker.cancellation import CancellationToken
from app.worker.process import run_process

Frame = npt.NDArray[np.uint8]


class NoxelizerExecutor:
  """
  Build a depixelization reveal video from a single image.

  Strategy:
  - generate pixelated frames from max_pix → min_pix
  - hold final sharp frame
  - encode with ffmpeg if available, else OpenCV fallback
  """

  ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}
  TARGET_WIDTH = 1920
  TARGET_HEIGHT = 1080
  TARGET_LONG_SIDE = max(TARGET_WIDTH, TARGET_HEIGHT)

  def __init__(
    self,
    *,
    fps: int = 60,
    duration: float = 15.0,
    min_pix: int = 1,
    max_pix: int = 120,
    final_hold: float = 0.75,
    codec: str = "mp4v",
    suffix: str = ".mp4",
    work_root: Path | None = None,
  ) -> None:
    self.fps = fps
    self.duration = duration
    self.min_pix = min_pix
    self.max_pix = max_pix
    self.final_hold = final_hold
    self.codec = codec
    self.suffix = self._normalize_suffix(suffix)

    self._validate_config(
      fps=self.fps,
      duration=self.duration,
      min_pix=self.min_pix,
      max_pix=self.max_pix,
      final_hold=self.final_hold,
    )

    self.work_root = work_root

  def execute(
    self,
    job: Job,
    *,
    cancel_token: CancellationToken | None = None,
  ) -> JobExecutionResult:
    if cancel_token:
      cancel_token.raise_if_cancelled()

    params = job.params or {}
    fps, duration, final_hold = self._resolve_options(params)

    input_file = ensure_path(
      job.input_path,
      missing_message="Input file is missing",
      not_found_message="Input file not found on disk",
    )
    self._validate_input_file(input_file)

    output_dir = Path(
      tempfile.mkdtemp(
        prefix="noxelizer_",
        dir=str(self.work_root) if self.work_root else None,
      )
    )
    try:
      output_name = self._build_output_name(input_file)
      final_path = output_dir / output_name

      tmp_path = self._create_temp_file(output_dir)

      try:
        frames_written = self._render_video(
          input_file,
          tmp_path,
          fps=fps,
          duration=duration,
          final_hold=final_hold,
          cancel_token=cancel_token,
        )

        if frames_written <= 0:
          raise ExecutionError("No frames were written")

        tmp_path.replace(final_path)

      except Exception:
        safe_unlink(tmp_path)
        raise

      return JobExecutionResult(
        summary={
          "frames": frames_written,
          "fps": fps,
          "duration": duration,
          "hold": final_hold,
          "codec": self.codec,
        },
        output_files=[
          JobOutputFile(
            path=final_path,
            type="video",
            name=output_name,
            format=final_path.suffix.lstrip(".") or None,
            label="Pixelate",
          ),
        ],
        cleanup_paths=[output_dir],
      )
    except Exception:
      safe_rmtree(output_dir)
      raise

  def _render_video(
    self,
    image_path: Path,
    output_path: Path,
    *,
    fps: int,
    duration: float,
    final_hold: float,
    cancel_token: CancellationToken | None,
  ) -> int:
    image = self._load_image(image_path)

    height, width = image.shape[:2]
    if height == 0 or width == 0:
      raise ExecutionError("Invalid image dimensions")

    canvas, rect = self._normalize_canvas(image)
    x, y, w, h = rect
    region = canvas[y:y + h, x:x + w]

    animated_frames = max(1, round(fps * duration))
    hold_frames = max(0, round(fps * final_hold))

    if self._has_ffmpeg():
      return self._render_with_ffmpeg(
        canvas,
        region,
        rect,
        output_path,
        animated_frames,
        hold_frames,
        fps=fps,
        cancel_token=cancel_token,
      )

    return self._render_with_cv2(
      canvas,
      region,
      rect,
      output_path,
      animated_frames,
      hold_frames,
      fps=fps,
      cancel_token=cancel_token,
    )

  def _load_image(self, image_path: Path) -> Frame:
    try:
      with Image.open(str(image_path)) as pil_image:
        pil_image = ImageOps.exif_transpose(pil_image)
        pil_image = pil_image.convert("RGB")
        rgb = np.array(pil_image)
    except Exception as exc:
      raise ExecutionError("Unable to read input image") from exc

    if rgb.size == 0:
      raise ExecutionError("Invalid image dimensions")

    return cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)

  def _normalize_canvas(self, image: Frame) -> tuple[Frame, tuple[int, int, int, int]]:
    target_w = self.TARGET_WIDTH
    target_h = self.TARGET_HEIGHT

    h, w = image.shape[:2]
    scale = min(target_w / w, target_h / h)
    resized_w = max(1, int(round(w * scale)))
    resized_h = max(1, int(round(h * scale)))

    resized = cv2.resize(
      image,
      (resized_w, resized_h),
      interpolation=cv2.INTER_AREA if scale < 1 else cv2.INTER_LINEAR,
    )

    canvas = np.zeros((target_h, target_w, 3), dtype=np.uint8)
    offset_x = (target_w - resized_w) // 2
    offset_y = (target_h - resized_h) // 2
    canvas[offset_y:offset_y + resized_h, offset_x:offset_x + resized_w] = resized
    return canvas, (offset_x, offset_y, resized_w, resized_h)

  def _generate_frames(
    self,
    canvas: Frame,
    region: Frame,
    rect: tuple[int, int, int, int],
    count: int,
    *,
    cancel_token: CancellationToken | None,
  ) -> Iterable[Frame]:
    x, y, w, h = rect
    region_long = max(w, h)
    size_start = self._scale_pixel_size(self.max_pix, region_long)
    size_end = self._scale_pixel_size(self.min_pix, region_long)

    if count <= 1:
      size = self._clamp_pixel_size(size_end)
      frame = canvas.copy()
      frame[y:y + h, x:x + w] = self._pixelate(region, size)
      yield frame
      return

    for idx in range(count):
      if cancel_token:
        cancel_token.raise_if_cancelled()

      progress = idx / (count - 1)
      size = size_start + (size_end - size_start) * progress
      size = self._clamp_pixel_size(size)
      frame = canvas.copy()
      frame[y:y + h, x:x + w] = self._pixelate(region, size)
      yield frame

  def _pixelate(self, image: Frame, size: int) -> Frame:
    if size <= 1:
      return image

    h, w = image.shape[:2]
    sw = max(1, w // size)
    sh = max(1, h // size)

    down = cv2.resize(image, (sw, sh), interpolation=cv2.INTER_NEAREST)
    return cv2.resize(down, (w, h), interpolation=cv2.INTER_NEAREST)

  def _render_with_ffmpeg(
    self,
    canvas: Frame,
    region: Frame,
    rect: tuple[int, int, int, int],
    output_path: Path,
    animated_frames: int,
    hold_frames: int,
    *,
    fps: int,
    cancel_token: CancellationToken | None,
  ) -> int:
    frames_dir = Path(tempfile.mkdtemp(prefix="frames_", dir=output_path.parent))
    frames_written = 0

    try:
      for idx, frame in enumerate(
        self._generate_frames(canvas, region, rect, animated_frames, cancel_token=cancel_token)
      ):
        path = frames_dir / f"frame_{idx:05d}.png"
        if not cv2.imwrite(str(path), frame):
          raise StorageError("Failed to write frame")
        frames_written += 1

      for i in range(hold_frames):
        if cancel_token:
          cancel_token.raise_if_cancelled()
        path = frames_dir / f"frame_{frames_written + i:05d}.png"
        cv2.imwrite(str(path), canvas)
        frames_written += 1

      cmd = [
        "ffmpeg",
        "-y",
        "-framerate", str(fps),
        "-i", str(frames_dir / "frame_%05d.png"),
        "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2",
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "18",
        "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
        str(output_path),
      ]

      run_process(cmd, cancel_token=cancel_token)
      self.codec = "h264"

      return frames_written

    finally:
      shutil.rmtree(frames_dir, ignore_errors=True)

  def _render_with_cv2(
    self,
    canvas: Frame,
    region: Frame,
    rect: tuple[int, int, int, int],
    output_path: Path,
    animated_frames: int,
    hold_frames: int,
    *,
    fps: int,
    cancel_token: CancellationToken | None,
  ) -> int:
    fourcc = cv2.VideoWriter_fourcc(*self.codec)
    writer = cv2.VideoWriter(
      str(output_path),
      fourcc,
      fps,
      (canvas.shape[1], canvas.shape[0]),
    )

    if not writer.isOpened():
      raise StorageError("Failed to open video writer")

    frames_written = 0
    try:
      for frame in self._generate_frames(canvas, region, rect, animated_frames, cancel_token=cancel_token):
        writer.write(frame)
        frames_written += 1

      for _ in range(hold_frames):
        writer.write(canvas)
        frames_written += 1

    finally:
      writer.release()

    return frames_written

  def _scale_pixel_size(self, pixel_size: int, region_long: int) -> float:
    pixel_size = max(1, pixel_size)
    return max(1.0, float(pixel_size) * float(region_long) / float(self.TARGET_LONG_SIDE))

  def _clamp_pixel_size(self, size: float) -> int:
    return max(1, int(round(size)))

  def _resolve_options(self, params: dict) -> tuple[int, float, float]:
    fps = self._coerce_int(params.get("fps"), self.fps)
    duration = self._coerce_float(params.get("duration"), self.duration)
    final_hold = self._coerce_float(params.get("final_hold"), self.final_hold)

    self._validate_config(
      fps=fps,
      duration=duration,
      min_pix=self.min_pix,
      max_pix=self.max_pix,
      final_hold=final_hold,
    )

    return fps, duration, final_hold

  def _validate_config(
    self,
    *,
    fps: int,
    duration: float,
    min_pix: int,
    max_pix: int,
    final_hold: float,
  ) -> None:
    if fps <= 0:
      raise ExecutionError("fps must be positive")
    if duration <= 0:
      raise ExecutionError("duration must be positive")
    if min_pix < 1 or max_pix < 1:
      raise ExecutionError("pixel size must be >= 1")
    if max_pix < min_pix:
      raise ExecutionError("max_pix must be >= min_pix")
    if final_hold < 0:
      raise ExecutionError("final_hold must be >= 0")

  def _coerce_int(self, value, default: int) -> int:
    if isinstance(value, bool):
      return default
    if isinstance(value, int):
      return value
    if isinstance(value, float) and value.is_integer():
      return int(value)
    if isinstance(value, str):
      try:
        return int(value)
      except Exception:
        return default
    return default

  def _coerce_float(self, value, default: float) -> float:
    if isinstance(value, bool):
      return default
    if isinstance(value, (int, float)):
      return float(value)
    if isinstance(value, str):
      try:
        return float(value)
      except Exception:
        return default
    return default

  def _validate_input_file(self, path: Path) -> None:
    if not path.exists():
      raise ExecutionError("Input file not found")
    if path.suffix.lower() not in self.ALLOWED_EXTENSIONS:
      raise ExecutionError(f"Unsupported image extension: {path.suffix}")

  def _build_output_name(self, input_file: Path) -> str:
    stem = strip_known_suffix_from_stem(input_file.stem or "noxelizer") or "noxelizer"
    return append_name_suffix(f"{stem}{self.suffix}", "pixelate", strip_known=True)

  def _normalize_suffix(self, suffix: str) -> str:
    return suffix if suffix.startswith(".") else f".{suffix}"

  def _has_ffmpeg(self) -> bool:
    return shutil.which("ffmpeg") is not None

  def _create_temp_file(self, output_dir: Path) -> Path:
    tmp = tempfile.NamedTemporaryFile(
      dir=output_dir,
      suffix=self.suffix,
      delete=False,
    )
    path = Path(tmp.name)
    tmp.close()
    return path
