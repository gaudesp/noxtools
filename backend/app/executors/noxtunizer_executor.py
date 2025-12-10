"""Executor for running Essentia analysis for Noxtunizer jobs."""

from __future__ import annotations

import json
import os
import shutil
import subprocess
from pathlib import Path
from typing import Any, Dict, Tuple

from app.models.job import Job


class NoxtunizerExecutor:
  """
  Runs Essentia's music extractor to analyze audio files
  and returns BPM, key, duration.
  """

  def __init__(self, *, extractor_bin: str | None = None, base_output: Path | None = None) -> None:
    self.extractor_bin = extractor_bin or os.getenv("NOXTUNIZER_EXTRACTOR_BIN") or "/usr/local/bin/essentia_streaming_extractor_music"
    self.base_output = base_output or Path("media/noxtunizer/outputs")
    self.base_output.mkdir(parents=True, exist_ok=True)

  def execute(self, job: Job) -> Tuple[Path, list[str], dict]:
    """
    Run Essentia on the given job input.
    """
    if not job.input_path:
      raise ValueError("Input file is missing")

    input_file = Path(job.input_path)
    if not input_file.exists():
      raise ValueError("Input file not found on disk")

    output_dir = self.base_output / job.id
    output_dir.mkdir(parents=True, exist_ok=True)

    raw_json = output_dir / "essentia_output.json"
    completed = self._run_extractor(input_file, raw_json)

    if completed.returncode != 0:
      stderr = (completed.stderr or "").strip()
      raise RuntimeError(stderr or "Essentia failed to analyze the audio")

    if not raw_json.exists():
      raise RuntimeError("Essentia did not produce an output file")

    try:
      with raw_json.open("r", encoding="utf-8") as fp:
        payload = json.load(fp)
    except Exception as exc:
      raise RuntimeError("Failed to read Essentia output") from exc

    result = self._reduce_output(payload)
    return output_dir, [raw_json.name], result

  def _run_extractor(self, input_file: Path, output_json: Path) -> subprocess.CompletedProcess[str]:
    """
    Invoke the Essentia CLI.
    """
    binary_exists = shutil.which(self.extractor_bin) is not None or Path(self.extractor_bin).exists()
    if not binary_exists:
      raise RuntimeError(
        f"Essentia binary '{self.extractor_bin}' not found. Install it or set NOXTUNIZER_EXTRACTOR_BIN."
      )

    cmd = [
      self.extractor_bin,
      str(input_file),
      str(output_json),
    ]
    return subprocess.run(
      cmd,
      stdout=subprocess.PIPE,
      stderr=subprocess.PIPE,
      text=True,
      check=False,
    )

  def _reduce_output(self, payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Reduce Essentia JSON into clean UI fields.
    """
    bpm_raw = self._as_float(self._get(payload, ["rhythm", "bpm"]))
    bpm_value = round(bpm_raw) if bpm_raw is not None else None

    tonal = payload.get("tonal", {}) or {}
    key_key = tonal.get("key_key") or tonal.get("chords_key")
    key_scale = tonal.get("key_scale") or tonal.get("chords_scale")

    if isinstance(key_key, str):
      key_key = key_key.strip().upper()
    else:
      key_key = None

    if isinstance(key_scale, str):
      s = key_scale.strip().lower()
      if s == "major":
        key_scale = "Major"
      elif s == "minor":
        key_scale = "Minor"
      else:
        key_scale = None
    else:
      key_scale = None

    key_value = f"{key_key} {key_scale}" if key_key and key_scale else None

    duration_seconds = self._as_float(self._get(payload, ["metadata", "audio_properties", "length"]))
    duration_label = self._format_duration(duration_seconds)

    return {
      "bpm": bpm_value,
      "key": key_value,
      "duration_seconds": duration_seconds,
      "duration_label": duration_label,
    }


  def _as_float(self, value: Any) -> float | None:
    """
    Best-effort float conversion.
    """
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
    """
    Format seconds into M:SS.
    """
    if seconds is None:
      return "—"
    minutes = int(seconds // 60)
    secs = int(round(seconds % 60))
    if secs == 60:
      minutes += 1
      secs = 0
    return f"{minutes}:{secs:02d}"

  def _get(self, data: Dict[str, Any], path: list[str]) -> Any:
    """
    Safely descend nested dictionaries.
    """
    current: Any = data
    for key in path:
      if not isinstance(current, dict):
        return None
      current = current.get(key)
    return current
