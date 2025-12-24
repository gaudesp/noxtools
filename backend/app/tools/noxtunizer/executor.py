"""Executor for running Essentia analysis for Noxtunizer jobs."""

from __future__ import annotations

import json
import os
import shutil
import tempfile
from pathlib import Path
from typing import Any, Dict

from app.errors import ExecutionError
from app.jobs.model import Job
from app.jobs.schemas import JobExecutionResult
from app.utils.files import ensure_path, safe_unlink
from app.worker.cancellation import CancellationToken
from app.worker.process import run_process


class NoxtunizerExecutor:
  """
  Runs Essentia's music extractor to analyze audio files.

  Extracts and normalizes:
  - BPM
  - Key
  - Duration
  """

  def __init__(
    self,
    *,
    extractor_bin: str | None = None,
    work_root: Path | None = None,
  ) -> None:
    self.extractor_bin = (
      extractor_bin
      or os.getenv("NOXTUNIZER_EXTRACTOR_BIN")
      or "/usr/local/bin/essentia_streaming_extractor_music"
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

    input_file = ensure_path(
      job.input_path,
      missing_message="Input file is missing",
      not_found_message="Input file not found on disk",
    )
    tmp_handle = tempfile.NamedTemporaryFile(
      prefix="noxtunizer_",
      suffix=".json",
      dir=str(self.work_root) if self.work_root else None,
      delete=False,
    )
    output_json = Path(tmp_handle.name)
    tmp_handle.close()

    try:
      self._run_extractor(input_file, output_json, cancel_token=cancel_token)

      if not output_json.exists():
        raise ExecutionError("Essentia did not produce an output file")

      try:
        with output_json.open("r", encoding="utf-8") as fp:
          payload = json.load(fp)
      except Exception as exc:
        raise ExecutionError("Failed to read Essentia output") from exc

      summary = self._reduce_output(payload)
    finally:
      safe_unlink(output_json)

    return JobExecutionResult(
      summary=summary,
    )

  def _run_extractor(
    self,
    input_file: Path,
    output_json: Path,
    *,
    cancel_token: CancellationToken | None,
  ) -> None:
    binary_exists = (
      shutil.which(self.extractor_bin) is not None
      or Path(self.extractor_bin).exists()
    )
    if not binary_exists:
      raise ExecutionError(
        f"Essentia binary '{self.extractor_bin}' not found. "
        "Install it or set NOXTUNIZER_EXTRACTOR_BIN."
      )

    cmd = [
      self.extractor_bin,
      str(input_file),
      str(output_json),
    ]

    run_process(cmd, cancel_token=cancel_token)

  def _reduce_output(self, payload: Dict[str, Any]) -> Dict[str, Any]:
    bpm_raw = self._as_float(self._get(payload, ["rhythm", "bpm"]))
    bpm_value = round(bpm_raw) if bpm_raw is not None else None

    tonal = payload.get("tonal", {}) or {}
    key_key = tonal.get("key_key") or tonal.get("chords_key")
    key_scale = tonal.get("key_scale") or tonal.get("chords_scale")

    key_key = self._normalize_key(key_key) if isinstance(key_key, str) else None
    key_scale = self._normalize_scale(key_scale)

    key_value = f"{key_key} {key_scale}" if key_key and key_scale else None

    duration_seconds = self._as_float(
      self._get(payload, ["metadata", "audio_properties", "length"])
    )

    return {
      "bpm": bpm_value,
      "key": key_value,
      "duration": duration_seconds,
      "duration_label": self._format_duration(duration_seconds),
    }

  def _normalize_scale(self, scale: Any) -> str | None:
    if not isinstance(scale, str):
      return None
    s = scale.strip().lower()
    if s == "major":
      return "Major"
    if s == "minor":
      return "Minor"
    return None

  def _normalize_key(self, key: str | None) -> str | None:
    if not key or not isinstance(key, str):
      return None

    k = key.strip().upper()
    mapping = {
      "BB": "Bb",
      "EB": "Eb",
      "AB": "Ab",
      "DB": "Db",
      "GB": "Gb",
      "FB": "E",
      "CB": "B",
      "B#": "C",
      "E#": "F",
    }

    if k in mapping:
      return mapping[k]

    if len(k) == 2:
      note, accidental = k[0], k[1]
      if accidental == "B":
        return f"{note}b"
      if accidental == "#":
        return f"{note}#"

    return k.capitalize()

  def _as_float(self, value: Any) -> float | None:
    if isinstance(value, (int, float)):
      return float(value)
    if isinstance(value, str):
      try:
        return float(value)
      except Exception:
        return None
    if isinstance(value, dict) and "value" in value:
      return self._as_float(value.get("value"))
    return None

  def _format_duration(self, seconds: float | None) -> str:
    if seconds is None:
      return "—"
    minutes = int(seconds // 60)
    secs = int(round(seconds % 60))
    if secs == 60:
      minutes += 1
      secs = 0
    return f"{minutes}:{secs:02d}"

  def _get(self, data: Dict[str, Any], path: list[str]) -> Any:
    current: Any = data
    for key in path:
      if not isinstance(current, dict):
        return None
      current = current.get(key)
    return current
