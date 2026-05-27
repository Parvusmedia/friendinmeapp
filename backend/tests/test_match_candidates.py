from app.models.enums import DogSize, DogStatus, EnergyLevel, EnergyPreference
from app.services.match_candidates import (
    MatchFilterCriteria,
    criteria_from_listing,
    filter_dogs_by_criteria,
    merge_criteria,
)


class _Dog:
    def __init__(self, *, id: int, size: DogSize, energy: EnergyLevel, province: str, breed: str):
        self.id = id
        self.size = size
        self.energy_level = energy
        self.province = province
        self.breed = breed
        self.status = DogStatus.available


def test_filter_by_size_and_energy():
    dogs = [
        _Dog(id=1, size=DogSize.medium, energy=EnergyLevel.medium, province="Madrid", breed="Mestizo"),
        _Dog(id=2, size=DogSize.large, energy=EnergyLevel.medium, province="Madrid", breed="Mestizo"),
        _Dog(id=3, size=DogSize.medium, energy=EnergyLevel.high, province="Madrid", breed="Mestizo"),
    ]
    criteria = MatchFilterCriteria(sizes=("medium",), energy_level="medium")
    out = filter_dogs_by_criteria(dogs, criteria)
    assert [d.id for d in out] == [1]


def test_listing_merge_narrows_adopter():
    base = MatchFilterCriteria(sizes=("medium", "large"), energy_level="low")
    listing = criteria_from_listing(size="medium", energy_level="medium")
    merged = merge_criteria(base, listing)
    assert merged.sizes == ("medium",)
    assert merged.energy_level == "medium"


def test_province_does_not_exclude_dogs():
    dogs = [
        _Dog(id=1, size=DogSize.small, energy=EnergyLevel.medium, province="Madrid", breed="Galgo"),
        _Dog(id=2, size=DogSize.small, energy=EnergyLevel.medium, province="Alicante", breed="Galgo"),
    ]
    criteria = MatchFilterCriteria(sizes=("small",), energy_level="medium", province="Alicante")
    out = filter_dogs_by_criteria(dogs, criteria)
    assert [d.id for d in out] == [1, 2]
    assert criteria.is_restrictive()


def test_match_results_sort_key_prefers_province_at_equal_score():
    from app.services.match_candidates import match_results_sort_key

    d_near = _Dog(id=1, size=DogSize.small, energy=EnergyLevel.low, province="Alicante", breed="Mestizo")
    d_far = _Dog(id=2, size=DogSize.small, energy=EnergyLevel.low, province="Madrid", breed="Mestizo")
    k_near = match_results_sort_key(d_near, 80.0, preferred_province="Alicante")
    k_far = match_results_sort_key(d_far, 80.0, preferred_province="Alicante")
    assert k_near < k_far
