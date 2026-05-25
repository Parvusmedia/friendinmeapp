"""Razas canónicas y normalización (import CSV, panel, filtros)."""

from __future__ import annotations

import re
import unicodedata

BREED_OPTIONS: list[str] = [
    "Mestizo",
    "Galgo",
    "Podenco",
    "Mastín",
    "Pastor alemán",
    "Labrador",
    "Golden retriever",
    "Beagle",
    "Chihuahua",
    "Yorkshire",
    "Bulldog",
    "Husky",
    "Border collie",
    "Bodeguero",
    "Cocker",
    "Caniche",
    "Otro",
]


def _fold_key(text: str) -> str:
    t = text.strip().lower()
    t = unicodedata.normalize("NFD", t)
    t = "".join(c for c in t if unicodedata.category(c) != "Mn")
    t = re.sub(r"\s+", " ", t)
    return t


_CANONICAL_BY_FOLD: dict[str, str] = {_fold_key(b): b for b in BREED_OPTIONS}

# Claves en forma normalizada (sin acentos, minúsculas)
_BREED_ALIASES: dict[str, str] = {
    "mestizo": "Mestizo",
    "mestiza": "Mestizo",
    "mestizos": "Mestizo",
    "mestizas": "Mestizo",
    "cruzado": "Mestizo",
    "cruzada": "Mestizo",
    "mix": "Mestizo",
    "mixed": "Mestizo",
    "galgo": "Galgo",
    "galga": "Galgo",
    "galgos": "Galgo",
    "podenco": "Podenco",
    "podenca": "Podenco",
    "podencos": "Podenco",
    "mastin": "Mastín",
    "mastín": "Mastín",
    "mastines": "Mastín",
    "pastor aleman": "Pastor alemán",
    "pastor alemán": "Pastor alemán",
    "pastor alemanes": "Pastor alemán",
    "labrador": "Labrador",
    "labradores": "Labrador",
    "golden": "Golden retriever",
    "golden retriever": "Golden retriever",
    "golden retrievers": "Golden retriever",
    "beagle": "Beagle",
    "beagles": "Beagle",
    "chihuahua": "Chihuahua",
    "chihuahuas": "Chihuahua",
    "yorkshire": "Yorkshire",
    "yorkie": "Yorkshire",
    "bulldog": "Bulldog",
    "bulldogs": "Bulldog",
    "husky": "Husky",
    "huskies": "Husky",
    "border collie": "Border collie",
    "collie": "Border collie",
    "bodeguero": "Bodeguero",
    "bodeguero andaluz": "Bodeguero",
    "cocker": "Cocker",
    "cocker spaniel": "Cocker",
    "caniche": "Caniche",
    "poodle": "Caniche",
    "otro": "Otro",
    "otros": "Otro",
    "desconocido": "Otro",
    "desconocida": "Otro",
    "srd": "Mestizo",
    # Compuestos frecuentes en refugios → Mestizo
    "chihuahua mestiza": "Mestizo",
    "chihuahua mestizo": "Mestizo",
    "labrador mestizo": "Mestizo",
    "labrador mestiza": "Mestizo",
    "golden retriever mestizo": "Mestizo",
    "golden retriever mestiza": "Mestizo",
    "mastin mestizo": "Mestizo",
    "mastín mestizo": "Mestizo",
    "mastin mestiza": "Mestizo",
}

_MESTIZO_PATTERN = re.compile(
    r"\b(mestiz[oa]s?|cruzad[oa]s?|mix(?:ed)?)\b",
    re.IGNORECASE,
)


def normalize_breed(raw: str | None, *, default: str = "Mestizo") -> tuple[str, bool]:
    """
    Devuelve (raza canónica, hubo_cambio).
    Valores canónicos: BREED_OPTIONS.
    """
    if raw is None or not str(raw).strip():
        canonical = default if default in BREED_OPTIONS else "Mestizo"
        return canonical, False

    original = str(raw).strip()
    key = _fold_key(original)

    if key in _BREED_ALIASES:
        canonical = _BREED_ALIASES[key]
        return canonical, canonical != original

    if key in _CANONICAL_BY_FOLD:
        canonical = _CANONICAL_BY_FOLD[key]
        return canonical, canonical != original

    if _MESTIZO_PATTERN.search(original):
        return "Mestizo", original.lower() != "mestizo"

    # "labrador mestizo" u otras mezclas no listadas
    if " mestiz" in key or key.endswith(" mestizo") or key.endswith(" mestiza"):
        return "Mestizo", True

    # Coincidencia parcial con raza canónica (ej. "tipo labrador")
    for fold, canonical in _CANONICAL_BY_FOLD.items():
        if fold == "otro" or fold == "mestizo":
            continue
        if key == fold or key.endswith(f" {fold}") or key.startswith(f"{fold} "):
            return canonical, canonical != original

    return "Otro", True


def breeds_for_filters(db_breeds: list[str]) -> list[str]:
    """Lista única ordenada para selects y filtros."""
    normalized = {normalize_breed(b)[0] for b in db_breeds if b and b.strip()}
    return sorted(set(BREED_OPTIONS) | normalized, key=str.casefold)
