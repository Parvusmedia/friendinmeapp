from datetime import datetime

from pydantic import BaseModel, EmailStr

from app.schemas.adopter import AdopterProfileRead


class AdminStats(BaseModel):
    active_dogs: int
    shelters_count: int
    leads_count: int
    adopters_count: int
    top_contacted_dogs: list[dict]
    top_provinces_interest: list[dict]
    avg_compatibility_score: float | None
    leads_last_7_days: int
    adopters_last_7_days: int
    dogs_without_photo: int
    dogs_incomplete_ficha: int


class AdopterAdminListItem(BaseModel):
    id: int
    name: str
    email: EmailStr
    phone: str
    city: str
    province: str
    created_at: datetime
    consent_contact: bool
    consent_marketing: bool
    leads_count: int
    matches_count: int


class AdopterLeadBrief(BaseModel):
    id: int
    dog_id: int
    dog_name: str
    compatibility_score: float
    status: str
    message: str
    created_at: datetime


class AdopterAdminDetail(BaseModel):
    profile: AdopterProfileRead
    leads_count: int
    matches_count: int
    leads: list[AdopterLeadBrief]
