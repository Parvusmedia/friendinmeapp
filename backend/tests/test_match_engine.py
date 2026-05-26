from app.models.enums import (
    DogExperience,
    DogSize,
    DogStatus,
    EnergyLevel,
    EnergyPreference,
    HousingType,
    HoursAway,
    Sociability,
    TriState,
)
from app.services.match_engine import build_match_breakdown, compute_match
from tests.conftest import make_adopter, make_dog


def test_compute_match_high_when_compatible():
    adopter = make_adopter()
    dog = make_dog()
    comp = compute_match(adopter, dog)
    assert comp.compatibility_score >= 68
    assert comp.breakdown
    assert len(comp.breakdown) == 5


def test_compute_match_unavailable_dog():
    adopter = make_adopter()
    dog = make_dog(status=DogStatus.adopted)
    comp = compute_match(adopter, dog)
    assert comp.compatibility_score == 0.0
    assert comp.breakdown == []


def test_breakdown_apartment_mismatch():
    adopter = make_adopter(housing_type=HousingType.apartment)
    dog = make_dog(can_live_in_apartment=TriState.no)
    items = build_match_breakdown(adopter, dog)
    housing = next(i for i in items if i.key == "housing")
    assert housing.status == "risk"
    assert housing.percent < 30


def test_info_gaps_are_warnings_not_reasons_and_cap_score():
    adopter = make_adopter(has_children=True, has_cats=True, has_other_dogs=True)
    dog = make_dog(
        good_with_children=TriState.unknown,
        sociability_with_cats=Sociability.unknown,
        sociability_with_dogs=Sociability.unknown,
    )
    comp = compute_match(adopter, dog)
    assert comp.compatibility_score <= 68
    assert not any("No consta" in r for r in comp.reasons)
    assert any("niños" in w for w in comp.warnings)
    assert any("gatos" in w for w in comp.warnings)
    assert any("otro perro" in w.lower() for w in comp.warnings)
    family = next(i for i in comp.breakdown or [] if i.key == "family")
    assert family.status in ("warn", "risk")
    assert family.percent < 60
