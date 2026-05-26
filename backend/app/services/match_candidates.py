"""Acota el universo de perros antes del match (ahorra cómputo y tokens de IA)."""

from __future__ import annotations

from dataclasses import dataclass

from sqlalchemy.orm import Session

from app.constants.breeds import normalize_breed
from app.models.adopter import AdopterProfile
from app.models.dog import Dog
from app.models.enums import DogStatus, EnergyPreference
from app.utils.adopter_preferences import parse_breeds, parse_sizes
from app.utils.age_preferences import AGE_LABELS_ES, dog_matches_age_preference, parse_age_ranges


@dataclass(frozen=True)
class MatchFilterCriteria:
    sizes: tuple[str, ...] = ()
    energy_level: str | None = None
    province: str | None = None
    breeds: tuple[str, ...] = ()
    age_ranges: tuple[str, ...] = ()

    def is_restrictive(self) -> bool:
        return bool(self.sizes or self.energy_level or self.province or self.breeds or self.age_ranges)

    def summary_es(self) -> str:
        parts: list[str] = []
        if self.sizes:
            labels = {"small": "pequeño", "medium": "mediano", "large": "grande"}
            parts.append("tamaño " + ", ".join(labels.get(s, s) for s in self.sizes))
        if self.energy_level:
            labels = {"low": "baja", "medium": "media", "high": "alta"}
            parts.append(f"energía {labels.get(self.energy_level, self.energy_level)}")
        if self.province:
            parts.append(f"provincia {self.province}")
        if self.breeds:
            parts.append("raza " + ", ".join(self.breeds))
        if self.age_ranges:
            parts.append("edad " + ", ".join(AGE_LABELS_ES.get(a, a) for a in self.age_ranges))
        return "; ".join(parts) if parts else "sin filtros de preferencia"


def criteria_from_adopter(adopter: AdopterProfile) -> MatchFilterCriteria:
    sizes = tuple(parse_sizes(adopter.preferred_size))
    energy = None
    if adopter.preferred_energy != EnergyPreference.no_preference:
        energy = adopter.preferred_energy.value
    province = (adopter.province_preference or "").strip() or None
    breeds = tuple(parse_breeds(adopter.breed_preference))
    ages = tuple(parse_age_ranges(getattr(adopter, "preferred_age", None)))
    return MatchFilterCriteria(sizes=sizes, energy_level=energy, province=province, breeds=breeds, age_ranges=ages)


def merge_criteria(base: MatchFilterCriteria, extra: MatchFilterCriteria | None) -> MatchFilterCriteria:
    if extra is None:
        return base
    sizes = extra.sizes if extra.sizes else base.sizes
    energy = extra.energy_level or base.energy_level
    province = extra.province or base.province
    breeds = extra.breeds if extra.breeds else base.breeds
    ages = extra.age_ranges if extra.age_ranges else base.age_ranges
    return MatchFilterCriteria(
        sizes=sizes, energy_level=energy, province=province, breeds=breeds, age_ranges=ages
    )


def criteria_from_listing(
    *,
    size: str | None = None,
    energy_level: str | None = None,
    province: str | None = None,
    breed: str | None = None,
) -> MatchFilterCriteria | None:
    sizes: list[str] = []
    if size and size.strip().lower() in {"small", "medium", "large"}:
        sizes.append(size.strip().lower())
    energy = energy_level.strip().lower() if energy_level and energy_level.strip() else None
    if energy and energy not in {"low", "medium", "high"}:
        energy = None
    prov = province.strip() if province and province.strip() else None
    breeds: list[str] = []
    if breed and breed.strip():
        canonical = normalize_breed(breed.strip())[0]
        if canonical:
            breeds.append(canonical)
    if not sizes and not energy and not prov and not breeds:
        return None
    return MatchFilterCriteria(
        sizes=tuple(sizes),
        energy_level=energy,
        province=prov,
        breeds=tuple(breeds),
    )


def _dog_matches_breed(dog: Dog, breeds: tuple[str, ...]) -> bool:
    if not breeds:
        return True
    dog_b = normalize_breed(dog.breed or "")[0]
    norm_prefs = [normalize_breed(b)[0] for b in breeds]
    if dog_b and dog_b in norm_prefs:
        return True
    if "Mestizo" in norm_prefs and dog_b in ("Mestizo", "Otro", ""):
        return True
    return False


def filter_dogs_by_criteria(dogs: list[Dog], criteria: MatchFilterCriteria) -> list[Dog]:
    if not criteria.is_restrictive():
        return dogs

    out: list[Dog] = []
    for dog in dogs:
        if criteria.sizes and dog.size.value not in criteria.sizes:
            continue
        if criteria.energy_level and dog.energy_level.value != criteria.energy_level:
            continue
        if criteria.province and dog.province.strip().lower() != criteria.province.lower():
            continue
        if not _dog_matches_breed(dog, criteria.breeds):
            continue
        if criteria.age_ranges and not dog_matches_age_preference(dog.age_estimate, list(criteria.age_ranges)):
            continue
        out.append(dog)
    return out


def load_match_candidate_dogs(
    db: Session,
    *,
    adopter: AdopterProfile,
    dog_id: int | None = None,
    listing: MatchFilterCriteria | None = None,
) -> tuple[list[Dog], MatchFilterCriteria]:
    if dog_id is not None:
        dog = db.get(Dog, dog_id)
        if not dog or dog.status != DogStatus.available:
            return [], MatchFilterCriteria()
        return [dog], MatchFilterCriteria()

    criteria = merge_criteria(criteria_from_adopter(adopter), listing)
    base = db.query(Dog).filter(Dog.status == DogStatus.available).order_by(Dog.id.asc()).all()
    filtered = filter_dogs_by_criteria(base, criteria)
    return filtered, criteria
