"""Codificación de preferencias múltiples (tamaño, raza) en columnas string."""

from __future__ import annotations

SIZE_VALUES = frozenset({"small", "medium", "large"})
MAX_BREEDS = 3
MAX_SIZES = 3


def parse_sizes(raw: str | None) -> list[str]:
    if not raw or raw.strip() == "no_preference":
        return []
    out: list[str] = []
    for part in raw.split(","):
        p = part.strip().lower()
        if p in SIZE_VALUES and p not in out:
            out.append(p)
    return out


def encode_sizes(sizes: list[str] | None) -> str:
    if not sizes:
        return "no_preference"
    out: list[str] = []
    for s in sizes:
        p = (s or "").strip().lower()
        if p in SIZE_VALUES and p not in out:
            out.append(p)
    if not out:
        return "no_preference"
    return ",".join(out[:MAX_SIZES])


def parse_breeds(raw: str | None) -> list[str]:
    if not raw or not raw.strip():
        return []
    out: list[str] = []
    for part in raw.split(","):
        p = part.strip()
        if p and p not in out:
            out.append(p)
    return out


def encode_breeds(breeds: list[str] | None) -> str:
    if not breeds:
        return ""
    out: list[str] = []
    for b in breeds:
        p = (b or "").strip()
        if p and p not in out:
            out.append(p)
    return ",".join(out[:MAX_BREEDS])
