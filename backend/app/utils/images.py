"""Image variant helpers."""

from __future__ import annotations

from pathlib import Path
from typing import Optional

import cv2

IMAGE_SUPPORTED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}

IMAGE_VARIANTS: dict[str, dict[str, int | str]] = {
  "thumb": {
    "suffix": "_thumb",
    "extension": ".jpg",
    "max_dimension": 128,
    "jpeg_quality": 75,
  },
}


def image_variant_path(original: Path, *, variant: str) -> Path:
  config = IMAGE_VARIANTS[variant]
  return original.with_name(f"{original.stem}{config['suffix']}{config['extension']}")


def create_image_variant(original: Path, *, variant: str) -> Optional[Path]:
  try:
    if variant not in IMAGE_VARIANTS:
      return None
    if original.suffix.lower() not in IMAGE_SUPPORTED_EXTENSIONS:
      return None
    if not original.exists() or not original.is_file():
      return None

    config = IMAGE_VARIANTS[variant]

    image = cv2.imread(str(original))
    if image is None:
      return None

    height, width = image.shape[:2]
    if height == 0 or width == 0:
      return None

    largest_side = max(height, width)
    scale = min(1.0, float(config["max_dimension"]) / float(largest_side))

    target_width = max(1, int(round(width * scale)))
    target_height = max(1, int(round(height * scale)))

    resized = cv2.resize(
      image,
      (target_width, target_height),
      interpolation=cv2.INTER_AREA if scale < 1 else cv2.INTER_LINEAR,
    )

    output_path = image_variant_path(original, variant=variant)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    encode_params: list[int] = []
    if str(config["extension"]) in {".jpg", ".jpeg"}:
      encode_params = [int(cv2.IMWRITE_JPEG_QUALITY), int(config["jpeg_quality"])]

    if not cv2.imwrite(str(output_path), resized, encode_params):
      return None

    return output_path
  except Exception:
    return None
