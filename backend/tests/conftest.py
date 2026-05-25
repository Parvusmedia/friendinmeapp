import pytest

from app.models.adopter import AdopterProfile
from app.models.dog import Dog
from app.models.enums import (
    DogExperience,
    DogSex,
    DogSize,
    DogStatus,
    EnergyLevel,
    EnergyPreference,
    HousingType,
    HoursAway,
    Sociability,
    TriState,
)
from app.utils.adopter_preferences import encode_breeds, encode_sizes


def make_adopter(**overrides) -> AdopterProfile:
    data = dict(
        id=1,
        name="Test Adoptante",
        email="test@example.com",
        phone="600000000",
        city="Madrid",
        province="Madrid",
        housing_type=HousingType.house_with_garden,
        has_children=False,
        children_age_range="",
        has_other_dogs=False,
        has_cats=False,
        previous_dog_experience=DogExperience.medium,
        hours_away_from_home=HoursAway.h3_5,
        activity_level=EnergyLevel.medium,
        preferred_size=encode_sizes(["medium"]),
        preferred_energy=EnergyPreference.no_preference,
        adoption_reason="Compañía",
        important_notes="",
        province_preference="",
        breed_preference=encode_breeds([]),
        max_distance_km=50,
        consent_contact=True,
        consent_marketing=False,
    )
    data.update(overrides)
    return AdopterProfile(**data)


def make_dog(**overrides) -> Dog:
    data = dict(
        id=1,
        shelter_id=1,
        name="Luna",
        breed="Mestizo",
        age_estimate="2 años",
        size=DogSize.medium,
        sex=DogSex.female,
        province="Madrid",
        city="Madrid",
        energy_level=EnergyLevel.medium,
        sociability_with_dogs=Sociability.high,
        sociability_with_cats=Sociability.medium,
        can_be_alone_hours=Sociability.medium,
        good_with_children=TriState.yes,
        can_live_in_apartment=TriState.yes,
        needs_experience=TriState.no,
        medical_needs="",
        behaviour_notes="",
        story="",
        ideal_home="",
        status=DogStatus.available,
        main_image_url="/media/x.jpg",
        images=[],
        ai_generated_summary=None,
    )
    data.update(overrides)
    return Dog(**data)


@pytest.fixture
def sample_adopter() -> AdopterProfile:
    return make_adopter()


@pytest.fixture
def sample_dog() -> Dog:
    return make_dog()
