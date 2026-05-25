from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.enums import ShelterApplicationStatus


class ShelterApplicationCreate(BaseModel):
    organization_name: str = Field(min_length=2, max_length=255)
    contact_name: str = Field(min_length=2, max_length=255)
    email: EmailStr
    phone: str = Field(min_length=6, max_length=64)
    province: str = Field(min_length=2, max_length=128)
    city: str = Field(min_length=2, max_length=128)
    address: str = ""
    website: str | None = None
    description: str = ""
    message: str = ""


class ShelterApplicationRead(BaseModel):
    id: int
    organization_name: str
    contact_name: str
    email: str
    phone: str
    province: str
    city: str
    address: str
    website: str | None
    description: str
    message: str
    status: ShelterApplicationStatus
    admin_notes: str
    created_shelter_id: int | None
    created_at: datetime
    reviewed_at: datetime | None

    model_config = ConfigDict(from_attributes=True)


class ShelterApplicationReject(BaseModel):
    admin_notes: str = ""


class ShelterApplicationApproveResponse(BaseModel):
    application: ShelterApplicationRead
    shelter_id: int
