from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator

from app.constants.breeds import normalize_breed
from app.models.enums import (
    DogExperience,
    EnergyLevel,
    EnergyPreference,
    HousingType,
    HoursAway,
)
from app.utils.adopter_preferences import MAX_BREEDS, MAX_SIZES, SIZE_VALUES, encode_breeds, encode_sizes, parse_breeds, parse_sizes


def _normalize_size_list(v: list[str]) -> list[str]:
    out: list[str] = []
    for s in v:
        p = (s or "").strip().lower()
        if p in SIZE_VALUES and p not in out:
            out.append(p)
    if len(out) > MAX_SIZES:
        raise ValueError(f"Máximo {MAX_SIZES} tamaños preferidos")
    return out


def _normalize_breed_list(v: list[str]) -> list[str]:
    out: list[str] = []
    for b in v:
        if not (b or "").strip():
            continue
        canonical = normalize_breed(b.strip())[0]
        if canonical not in out:
            out.append(canonical)
    if len(out) > MAX_BREEDS:
        raise ValueError(f"Máximo {MAX_BREEDS} razas preferidas")
    return out


class AdopterProfileCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str
    province: str
    city: str
    housing_type: HousingType
    has_children: bool
    children_age_range: str | None = None
    has_other_dogs: bool
    has_cats: bool
    previous_dog_experience: DogExperience
    hours_away_from_home: HoursAway
    activity_level: EnergyLevel
    preferred_sizes: list[str] = Field(default_factory=list)
    preferred_energy: EnergyPreference
    adoption_reason: str = ""
    important_notes: str = ""
    province_preference: str = ""
    breed_preferences: list[str] = Field(default_factory=list)
    max_distance_km: int | None = None
    consent_marketing: bool = False
    consent_contact: bool

    @field_validator("preferred_sizes")
    @classmethod
    def validate_sizes(cls, v: list[str]) -> list[str]:
        return _normalize_size_list(v)

    @field_validator("breed_preferences")
    @classmethod
    def validate_breeds(cls, v: list[str]) -> list[str]:
        return _normalize_breed_list(v)


class AdopterProfileUpdate(AdopterProfileCreate):
    pass


class AdopterProfileRead(AdopterProfileCreate):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode="before")
    @classmethod
    def from_db_row(cls, data: Any) -> Any:
        if data is None or isinstance(data, dict):
            return data
        if hasattr(data, "preferred_size") and hasattr(data, "breed_preference"):
            return {
                "id": data.id,
                "created_at": data.created_at,
                "name": data.name,
                "email": data.email,
                "phone": data.phone,
                "province": data.province,
                "city": data.city,
                "housing_type": data.housing_type,
                "has_children": data.has_children,
                "children_age_range": data.children_age_range,
                "has_other_dogs": data.has_other_dogs,
                "has_cats": data.has_cats,
                "previous_dog_experience": data.previous_dog_experience,
                "hours_away_from_home": data.hours_away_from_home,
                "activity_level": data.activity_level,
                "preferred_sizes": parse_sizes(data.preferred_size),
                "preferred_energy": data.preferred_energy,
                "adoption_reason": data.adoption_reason or "",
                "important_notes": data.important_notes or "",
                "province_preference": data.province_preference or "",
                "breed_preferences": parse_breeds(data.breed_preference),
                "max_distance_km": data.max_distance_km,
                "consent_marketing": data.consent_marketing,
                "consent_contact": data.consent_contact,
            }
        return data


def adopter_create_to_row_fields(payload: AdopterProfileCreate) -> dict[str, Any]:
    data = payload.model_dump()
    sizes = data.pop("preferred_sizes", [])
    breeds = data.pop("breed_preferences", [])
    data["preferred_size"] = encode_sizes(sizes)
    data["breed_preference"] = encode_breeds(breeds)
    return data


class AdopterLookupRequest(BaseModel):
    email: EmailStr


class AdopterLookupResponse(BaseModel):
    found: bool
    profile: AdopterProfileRead | None = None


class AdopterSendResultsLinkRequest(BaseModel):
    email: EmailStr


class AdopterSendResultsLinkResponse(BaseModel):
    sent: bool
    message: str


class AdopterVerifyTokenResponse(BaseModel):
    valid: bool
    adopter_profile_id: int | None = None
