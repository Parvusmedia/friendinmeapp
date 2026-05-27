"""Rangos de edad preferidos y clasificación orientativa de age_estimate."""

from __future__ import annotations

import re

AGE_VALUES = frozenset({"puppy", "young", "adult", "senior"})
MAX_AGE_RANGES = 4

# Tramos vitales alineados con filtros y cuestionario (por meses).
PUPPY_MAX_MONTHS = 12
YOUNG_MAX_MONTHS = 36
ADULT_MAX_MONTHS = 83

AGE_LABELS_ES = {
    "puppy": "Cachorro (hasta 1 año)",
    "young": "Joven (1-3 años)",
    "adult": "Adulto (3-7 años)",
    "senior": "Senior (7 años o más)",
}


def parse_age_ranges(raw: str | None) -> list[str]:
    if not raw or raw.strip() == "no_preference":
        return []
    out: list[str] = []
    for part in raw.split(","):
        p = part.strip().lower()
        if p in AGE_VALUES and p not in out:
            out.append(p)
    return out


def encode_age_ranges(ranges: list[str] | None) -> str:
    if not ranges:
        return "no_preference"
    out: list[str] = []
    for r in ranges:
        p = (r or "").strip().lower()
        if p in AGE_VALUES and p not in out:
            out.append(p)
    if not out:
        return "no_preference"
    return ",".join(out[:MAX_AGE_RANGES])


def estimate_age_months(age_estimate: str) -> int | None:
    """Interpreta age_estimate libre (ej. '3 años', '8 meses')."""
    text = (age_estimate or "").lower().strip()
    if not text:
        return None
    m = re.search(r"(\d+)\s*(mes(?:es)?|año|anos|year)", text)
    if not m:
        m = re.search(r"(\d+)", text)
        if not m:
            return None
        n = int(m.group(1))
        if n <= 20:
            return n * 12
        return None
    n = int(m.group(1))
    unit = m.group(2)
    if unit.startswith("mes"):
        return n
    return n * 12


def age_stage_key(age_estimate: str) -> str | None:
    """Clave única puppy|young|adult|senior si la edad es interpretable."""
    cats = dog_age_categories(age_estimate)
    if len(cats) == 1:
        return next(iter(cats))
    return None


def dog_age_categories(age_estimate: str) -> set[str]:
    """Categoría vital única según edad declarada."""
    months = estimate_age_months(age_estimate)
    if months is None:
        return set(AGE_VALUES)
    if months <= PUPPY_MAX_MONTHS:
        return {"puppy"}
    if months <= YOUNG_MAX_MONTHS:
        return {"young"}
    if months <= ADULT_MAX_MONTHS:
        return {"adult"}
    return {"senior"}


def dog_matches_age_preference(age_estimate: str, preferred: list[str]) -> bool:
    if not preferred:
        return True
    dog_cats = dog_age_categories(age_estimate)
    return bool(dog_cats.intersection(preferred))
