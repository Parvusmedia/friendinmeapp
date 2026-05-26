from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import DogSex, DogSize, DogStatus, EnergyLevel, Sociability, TriState


class DogBase(BaseModel):
    name: str
    breed: str = ""
    age_estimate: str
    size: DogSize
    sex: DogSex
    province: str
    city: str
    energy_level: EnergyLevel
    sociability_with_dogs: Sociability
    sociability_with_cats: Sociability
    good_with_children: TriState
    can_live_in_apartment: TriState
    needs_experience: TriState
    can_be_alone_hours: Sociability
    medical_needs: str = ""
    behaviour_notes: str = ""
    story: str = ""
    ideal_home: str = ""
    status: DogStatus = DogStatus.available
    main_image_url: str | None = None
    images: list[Any] = Field(default_factory=list)


class DogCreate(DogBase):
    shelter_id: int | None = None


class DogUpdate(BaseModel):
    name: str | None = None
    breed: str | None = None
    age_estimate: str | None = None
    size: DogSize | None = None
    sex: DogSex | None = None
    province: str | None = None
    city: str | None = None
    energy_level: EnergyLevel | None = None
    sociability_with_dogs: Sociability | None = None
    sociability_with_cats: Sociability | None = None
    good_with_children: TriState | None = None
    can_live_in_apartment: TriState | None = None
    needs_experience: TriState | None = None
    can_be_alone_hours: Sociability | None = None
    medical_needs: str | None = None
    behaviour_notes: str | None = None
    story: str | None = None
    ideal_home: str | None = None
    status: DogStatus | None = None
    main_image_url: str | None = None
    images: list[Any] | None = None
    ai_generated_summary: str | None = None


class DogRead(DogBase):
    id: int
    shelter_id: int
    ai_generated_summary: str | None = None
    created_at: datetime
    updated_at: datetime
    """Fotos válidas en disco (≥1 KB); 0 = sin foto usable."""
    photo_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class DogPublicDetail(DogRead):
    shelter_name: str = ""
    shelter_whatsapp: str = ""
    shelter_contact_name: str = ""
    shelter_contact_mobile: str = ""


class DogStatusPatch(BaseModel):
    status: DogStatus


class DogImagePath(BaseModel):
    path: str
