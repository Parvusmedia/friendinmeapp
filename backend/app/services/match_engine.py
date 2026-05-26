"""Compatibility scoring: deterministic rules only. AI layers on top separately."""

from dataclasses import dataclass
from typing import Any

from app.constants.breeds import normalize_breed
from app.models.adopter import AdopterProfile
from app.models.dog import Dog
from app.models.enums import (
    DogExperience,
    DogSize,
    DogStatus,
    EnergyLevel,
    EnergyPreference,
    HousingType,
    HoursAway,
    MatchLevel,
    Sociability,
    TriState,
)
from app.utils.adopter_preferences import parse_breeds, parse_sizes


@dataclass
class MatchBreakdownItem:
    key: str
    label: str
    percent: int
    status: str  # good | warn | risk | neutral


@dataclass
class MatchComputation:
    dog_id: int
    compatibility_score: float
    match_level: MatchLevel
    reasons: list[str]
    warnings: list[str]
    breakdown: list[MatchBreakdownItem] | None = None


def _hours_away_rank(h: HoursAway) -> int:
    mapping = {
        HoursAway.h0_2: 1,
        HoursAway.h3_5: 2,
        HoursAway.h6_8: 3,
        HoursAway.more_than_8: 4,
    }
    return mapping.get(h, 2)


def _dog_alone_tolerance_rank(dog_alone: Sociability) -> int | None:
    """Higher rank = tolerates more hours alone. None if unknown."""
    if dog_alone == Sociability.unknown:
        return None
    mapping = {
        Sociability.low: 1,
        Sociability.medium: 2,
        Sociability.high: 3,
    }
    return mapping.get(dog_alone)


def _energy_rank(level: EnergyLevel) -> int:
    return {EnergyLevel.low: 1, EnergyLevel.medium: 2, EnergyLevel.high: 3}[level]


def _adopter_activity_rank(a: AdopterProfile) -> int:
    return _energy_rank(a.activity_level)


def _preferred_energy_to_rank(pref: EnergyPreference) -> int | None:
    if pref == EnergyPreference.no_preference:
        return None
    mapping = {
        EnergyPreference.low: 1,
        EnergyPreference.medium: 2,
        EnergyPreference.high: 3,
    }
    return mapping[pref]


def _note_info_gap(
    warnings: list[str],
    seen: set[str],
    message: str,
    *,
    penalty: float,
) -> float:
    """Registra información pendiente en advertencias (no en motivos positivos)."""
    if message not in seen:
        warnings.append(message)
        seen.add(message)
    return penalty


def build_match_breakdown(adopter: AdopterProfile, dog: Dog) -> list[MatchBreakdownItem]:
    """Orientative sub-scores for UI (not stored separately in DB)."""
    items: list[MatchBreakdownItem] = []

    if adopter.housing_type == HousingType.apartment:
        if dog.can_live_in_apartment == TriState.yes:
            items.append(MatchBreakdownItem("housing", "Hogar y espacio", 92, "good"))
        elif dog.can_live_in_apartment == TriState.no:
            items.append(MatchBreakdownItem("housing", "Hogar y espacio", 18, "risk"))
        else:
            items.append(MatchBreakdownItem("housing", "Hogar y espacio", 52, "warn"))
    else:
        items.append(MatchBreakdownItem("housing", "Hogar y espacio", 78, "good"))

    if dog.needs_experience == TriState.yes and adopter.previous_dog_experience == DogExperience.none:
        items.append(MatchBreakdownItem("experience", "Experiencia", 22, "risk"))
    elif dog.needs_experience == TriState.yes and adopter.previous_dog_experience == DogExperience.low:
        items.append(MatchBreakdownItem("experience", "Experiencia", 48, "warn"))
    else:
        items.append(MatchBreakdownItem("experience", "Experiencia", 82, "good"))

    family_penalty = 0
    if adopter.has_children and dog.good_with_children == TriState.no:
        family_penalty += 40
    elif adopter.has_children and dog.good_with_children == TriState.unknown:
        family_penalty += 18
    if adopter.has_cats and dog.sociability_with_cats == Sociability.low:
        family_penalty += 25
    elif adopter.has_cats and dog.sociability_with_cats == Sociability.unknown:
        family_penalty += 18
    if adopter.has_other_dogs and dog.sociability_with_dogs == Sociability.low:
        family_penalty += 25
    elif adopter.has_other_dogs and dog.sociability_with_dogs == Sociability.unknown:
        family_penalty += 18
    family_score = max(15, 88 - family_penalty)
    fam_status = "risk" if family_penalty >= 35 else ("warn" if family_penalty else "good")
    items.append(MatchBreakdownItem("family", "Familia y convivencia", family_score, fam_status))

    act = _adopter_activity_rank(adopter)
    dog_e = _energy_rank(dog.energy_level)
    energy_gap = abs(act - dog_e)
    energy_score = {0: 90, 1: 72, 2: 48}.get(energy_gap, 35)
    energy_status = "good" if energy_gap == 0 else ("warn" if energy_gap == 1 else "risk")
    items.append(MatchBreakdownItem("energy", "Energía y actividad", energy_score, energy_status))

    loc_score = 70
    if adopter.province_preference and adopter.province_preference.lower() == dog.province.lower():
        loc_score = 92
    elif adopter.province.lower() == dog.province.lower():
        loc_score = 85
    items.append(MatchBreakdownItem("location", "Ubicación y preferencias", loc_score, "good" if loc_score >= 80 else "neutral"))
    return items


def compute_match(adopter: AdopterProfile, dog: Dog) -> MatchComputation:
    reasons: list[str] = []
    warnings: list[str] = []
    info_gaps_seen: set[str] = set()
    info_gap_count = 0
    score = 72.0
    critical = False

    if dog.status != DogStatus.available:
        return MatchComputation(
            dog_id=dog.id,
            compatibility_score=0.0,
            match_level=MatchLevel.risky,
            reasons=[],
            warnings=["Este perro no está disponible para adopción en este momento."],
            breakdown=[],
        )

    def gap(message: str, penalty: float) -> None:
        nonlocal score, info_gap_count
        score -= _note_info_gap(warnings, info_gaps_seen, message, penalty=penalty)
        info_gap_count += 1

    # --- Información pendiente (no va a «por qué encaja») ---
    if dog.good_with_children == TriState.unknown and adopter.has_children:
        gap(
            "No consta en la ficha si el perro convive bien con niños; conviene preguntar al refugio.",
            10.0,
        )
    if dog.sociability_with_cats == Sociability.unknown and adopter.has_cats:
        gap(
            "No consta la convivencia del perro con gatos; el refugio puede concretarlo.",
            10.0,
        )
    if adopter.has_other_dogs and dog.sociability_with_dogs == Sociability.unknown:
        gap(
            "Hay otro perro en casa; no consta claramente la sociabilidad con otros perros: preguntar al refugio.",
            10.0,
        )
    if dog.can_live_in_apartment == TriState.unknown and adopter.housing_type == HousingType.apartment:
        gap(
            "No consta si el perro se adapta a piso; información pendiente con el refugio.",
            8.0,
        )
    if dog.needs_experience == TriState.unknown:
        gap(
            "No consta si el perro requiere experiencia previa; verificar con el refugio.",
            5.0,
        )

    # --- Strong penalties ---
    if adopter.housing_type == HousingType.apartment and dog.can_live_in_apartment == TriState.no:
        warnings.append("El adoptante vive en piso y la ficha indica que el perro no es adecuado para apartamento.")
        score -= 38
        critical = True

    if dog.needs_experience == TriState.yes and adopter.previous_dog_experience == DogExperience.none:
        warnings.append("El perro requiere experiencia y el adoptante indica experiencia nula con perros.")
        score -= 36
        critical = True
    elif dog.needs_experience == TriState.yes and adopter.previous_dog_experience == DogExperience.low:
        warnings.append("El perro requiere experiencia; el adoptante tiene experiencia limitada.")
        score -= 18

    if adopter.has_children and dog.good_with_children == TriState.no:
        warnings.append("Hay niños en el hogar y la ficha indica que el perro no es adecuado con niños.")
        score -= 38
        critical = True

    if adopter.has_cats and dog.sociability_with_cats in (Sociability.low,):
        warnings.append("Hay gatos en casa y la ficha sugiere baja sociabilidad del perro con gatos.")
        score -= 22

    adopter_away = _hours_away_rank(adopter.hours_away_from_home)
    alone_tol = _dog_alone_tolerance_rank(dog.can_be_alone_hours)
    if alone_tol is not None and adopter_away > alone_tol + 1:
        warnings.append(
            "El tiempo fuera de casa del adoptante podría ser elevado para la tolerancia a la soledad indicada del perro."
        )
        score -= 20
    elif alone_tol is None and adopter_away >= 3:
        gap(
            "No consta bien la tolerancia del perro a estar solo; conviene validarlo con el refugio.",
            7.0,
        )

    # --- Positive signals ---
    if adopter.province_preference and adopter.province_preference.lower() == dog.province.lower():
        reasons.append("Coincidencia de provincia con la preferencia del adoptante.")
        score += 8
    elif adopter.province.lower() == dog.province.lower():
        reasons.append("Misma provincia que la del adoptante.")
        score += 6

    pref_breeds = parse_breeds(adopter.breed_preference)
    if pref_breeds:
        dog_b = normalize_breed(dog.breed)[0]
        if dog_b:
            normalized_prefs = [normalize_breed(b)[0] for b in pref_breeds]
            if dog_b in normalized_prefs:
                reasons.append(f"La raza orientativa ({dog_b}) coincide con una de tus preferencias.")
                score += 6
            elif "Mestizo" in normalized_prefs and dog_b == "Mestizo":
                reasons.append("Coincidencia en preferencia por mestizo.")
                score += 4
            elif not any(p in ("Otro", "Mestizo") for p in normalized_prefs) and dog_b not in ("Otro", "Mestizo"):
                warnings.append(
                    f"Tus razas preferidas ({', '.join(normalized_prefs)}) no incluyen la ficha ({dog_b}); "
                    "es orientativo, no excluyente."
                )
                score -= 3

    pref_sizes = parse_sizes(adopter.preferred_size)
    if pref_sizes:
        dog_size = dog.size.value if hasattr(dog.size, "value") else str(dog.size)
        if dog_size in pref_sizes:
            reasons.append("El tamaño del perro coincide con una de tus preferencias.")
            score += 8
        else:
            warnings.append(
                f"El tamaño del perro ({dog_size}) no está entre tus preferencias ({', '.join(pref_sizes)}); "
                "es orientativo."
            )
            score -= 2

    pref_e = _preferred_energy_to_rank(adopter.preferred_energy)
    if pref_e is not None and pref_e == _energy_rank(dog.energy_level):
        reasons.append("El nivel de energía del perro encaja con la preferencia declarada.")
        score += 8

    act = _adopter_activity_rank(adopter)
    dog_e = _energy_rank(dog.energy_level)
    if abs(act - dog_e) == 0:
        reasons.append("El nivel de actividad del hogar encaja con la energía del perro.")
        score += 10
    elif abs(act - dog_e) == 1:
        reasons.append("El nivel de actividad del hogar es razonablemente compatible con la energía del perro.")
        score += 4
    else:
        warnings.append("Puede haber desajuste entre el ritmo de actividad del hogar y la energía del perro.")
        score -= 8

    if adopter.has_other_dogs and dog.sociability_with_dogs == Sociability.high:
        reasons.append("El perro muestra buena sociabilidad con otros perros y ya hay perro en casa.")
        score += 8
    elif adopter.has_other_dogs and dog.sociability_with_dogs in (Sociability.low,):
        warnings.append("Ya hay perro en casa y la ficha indica baja sociabilidad con otros perros.")
        score -= 14
    # --- Garden bonus ---
    if dog.can_live_in_apartment == TriState.no and adopter.housing_type in (
        HousingType.house_with_garden,
        HousingType.rural,
    ):
        reasons.append("Tipo de vivienda con espacio exterior encaja con un perro que puede necesitar más espacio.")
        score += 6

    # Techo si hay varios datos por contrastar con el refugio
    if info_gap_count >= 3:
        score = min(score, 62.0)
    elif info_gap_count >= 2:
        score = min(score, 68.0)
    elif info_gap_count >= 1:
        score = min(score, 75.0)

    score = max(0.0, min(100.0, round(score, 1)))

    if critical and score > 45:
        score = min(score, 44.0)

    # Nunca clasificar «no consta» como motivo positivo
    reasons = [r for r in reasons if not r.lower().startswith("no consta")]

    if score >= 82 and not critical and info_gap_count == 0:
        level = MatchLevel.excellent
    elif score >= 68:
        level = MatchLevel.good
    elif score >= 48:
        level = MatchLevel.possible
    else:
        level = MatchLevel.risky

    if not reasons:
        if info_gap_count:
            warnings.append(
                "Hay aspectos de la ficha sin confirmar; la puntuación es provisional hasta contrastar con el refugio."
            )
        else:
            reasons.append("Puntuación basada en los datos disponibles; revisa advertencias y consulta al refugio.")

    breakdown = build_match_breakdown(adopter, dog)
    return MatchComputation(
        dog_id=dog.id,
        compatibility_score=score,
        match_level=level,
        reasons=reasons,
        warnings=warnings,
        breakdown=breakdown,
    )


def score_to_dict(computation: MatchComputation) -> dict[str, Any]:
    return {
        "dog_id": computation.dog_id,
        "compatibility_score": computation.compatibility_score,
        "match_level": computation.match_level.value,
        "reasons": computation.reasons,
        "warnings": computation.warnings,
    }
