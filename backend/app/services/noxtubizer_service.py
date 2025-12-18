"""Service layer for orchestrating Noxtubizer jobs."""

from __future__ import annotations

from pathlib import Path
from typing import Literal

from pydantic import BaseModel, HttpUrl

from app.executors.noxtubizer_executor import NoxtubizerExecutor
from app.models.job import Job, JobTool, JobUpdate
from app.services.job_service import JobService
from app.services.youtube_url_sanitizer import YouTubeUrlSanitizer
from app.workers.job_worker import CancellationToken
from app.workers.job_types import JobExecutionResult


class NoxtubizerJobRequest(BaseModel):
  """Validated request payload for creating a Noxtubizer job."""

  url: HttpUrl
  mode: Literal["audio", "video", "both"]
  audio_quality: Literal["high", "320kbps", "256kbps", "128kbps", "64kbps"] | None = None
  audio_format: Literal["mp3", "m4a", "ogg", "wav"] | None = None
  video_quality: Literal["best", "4320p", "2160p", "1440p", "1080p", "720p", "480p", "360p", "240p"] | None = None
  video_format: Literal["mp4", "mkv"] | None = None


class NoxtubizerService:
  """Handles Noxtubizer job creation and execution."""

  BASE_OUTPUT = Path("media/noxtubizer/outputs")

  def __init__(self, job_service: JobService) -> None:
    self.job_service = job_service
    self.BASE_OUTPUT.mkdir(parents=True, exist_ok=True)
    self.executor = NoxtubizerExecutor(base_output=self.BASE_OUTPUT)
    self.url_sanitizer = YouTubeUrlSanitizer()

  def create_job(self, payload: NoxtubizerJobRequest) -> Job:
    """
    Persist a new Noxtubizer job using the provided options.
    """
    params = self._normalize_params(payload.model_dump())
    self._validate_params(params)

    return self.job_service.create_job(
      tool=JobTool.NOXTUBIZER,
      input_filename=params["url"],
      params=params
    )

  def process_job(self, job: Job, cancel_token: CancellationToken) -> JobExecutionResult:
    """
    Execute the Noxtubizer workflow and persist outputs.
    """
    cancel_token.raise_if_cancelled()
    output_dir, outputs, result = self.executor.execute(job, cancel_token=cancel_token)
    source_title = result.get("source_title")
    if source_title and source_title != job.input_filename:
      self.job_service.update_job(job.id, JobUpdate(input_filename=source_title))

    return JobExecutionResult(
      output_path=output_dir,
      output_files=outputs,
      result=result,
    )

  def _validate_params(self, params: dict) -> None:
    """
    Ensure the mode-specific options are present.
    """
    mode = params.get("mode")
    if mode not in ("audio", "video", "both"):
      raise ValueError("Mode must be one of: audio, video, both")

    if mode in ("audio", "both"):
      if not params.get("audio_quality") or not params.get("audio_format"):
        raise ValueError("Audio mode requires audio_quality and audio_format")

    if mode in ("video", "both"):
      if not params.get("video_quality") or not params.get("video_format"):
        raise ValueError("Video mode requires video_quality and video_format")

  def _normalize_params(self, params: dict) -> dict:
    """
    Normalize and fill defaults for incoming params to make validation predictable.
    """
    next_params = dict(params)
    mode = str(next_params.get("mode") or "").lower()
    next_params["mode"] = mode
    raw_url = str(next_params.get("url") or "").strip()
    next_params["url"] = self.url_sanitizer.canonical_single_video_url(raw_url)

    if mode in ("audio", "both"):
      next_params["audio_quality"] = next_params.get("audio_quality") or "high"
      next_params["audio_format"] = next_params.get("audio_format") or "mp3"

    if mode in ("video", "both"):
      next_params["video_quality"] = next_params.get("video_quality") or "best"
      next_params["video_format"] = next_params.get("video_format") or "mp4"

    return next_params
