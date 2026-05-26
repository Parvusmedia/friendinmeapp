from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.enums import LeadStatus


class LeadCreate(BaseModel):
    adopter_profile_id: int
    dog_id: int
    name: str
    email: EmailStr
    phone: str
    province: str
    message: str = ""
    compatibility_score: float = Field(ge=0, le=100)


class LeadRead(BaseModel):
    id: int
    adopter_profile_id: int
    dog_id: int
    shelter_id: int
    name: str
    email: EmailStr
    phone: str
    province: str
    message: str
    compatibility_score: float
    status: LeadStatus
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LeadAdopterRead(LeadRead):
    dog_name: str = ""
    dog_main_image_url: str | None = None
    shelter_name: str = ""


class LeadCheckResponse(BaseModel):
    exists: bool
    lead: LeadAdopterRead | None = None


class AdopterLeadAuth(BaseModel):
    adopter_profile_id: int
    email: EmailStr


class LeadStatusUpdate(BaseModel):
    status: LeadStatus
