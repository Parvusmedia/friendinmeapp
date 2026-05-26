"""Utilidades para contar y validar fotos de perros en disco."""

from __future__ import annotations

from pathlib import Path

from app.config import get_settings
from app.models.dog import Dog

MIN_BYTES = 1024


def iter_dog_image_paths(dog: Dog) -> set[str]:
    paths: set[str] = set()
    if dog.main_image_url:
        paths.add(dog.main_image_url)
    for p in dog.images or []:
        if isinstance(p, str) and p:
            paths.add(p)
    return paths


def is_valid_media_file(public_path: str, upload_dir: Path | None = None) -> bool:
    if not public_path.startswith("/media/"):
        return False
    root = upload_dir or Path(get_settings().upload_dir)
    target = root / Path(public_path).name
    return target.is_file() and target.stat().st_size >= MIN_BYTES


def count_valid_photos(dog: Dog) -> int:
    return sum(1 for p in iter_dog_image_paths(dog) if is_valid_media_file(p))


def count_photo_paths(dog: Dog) -> int:
    """Rutas únicas en BD (pueden incluir placeholders rotos)."""
    return len(iter_dog_image_paths(dog))
