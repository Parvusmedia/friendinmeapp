from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class PartnerCampaignBase(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    placement: str = Field(min_length=1, max_length=64)
    active: bool = True
    priority: int = Field(default=0, ge=0, le=1000)
    starts_at: datetime | None = None
    ends_at: datetime | None = None
    sponsor_name: str = Field(min_length=1, max_length=120)
    icon: str | None = Field(default=None, max_length=16)
    headline: str = Field(min_length=1, max_length=500)
    body: str = Field(min_length=1)
    bullets: list[str] = Field(default_factory=list)
    cta_label: str = Field(min_length=1, max_length=120)
    cta_url: str = Field(min_length=1, max_length=500)
    discount_code: str | None = Field(default=None, max_length=64)
    discount_note: str | None = Field(default=None, max_length=255)
    match_sizes: list[str] | None = None
    match_energy_levels: list[str] | None = None
    match_age_stages: list[str] | None = None


class PartnerCampaignCreate(PartnerCampaignBase):
    pass


class PartnerCampaignUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    placement: str | None = Field(default=None, min_length=1, max_length=64)
    active: bool | None = None
    priority: int | None = Field(default=None, ge=0, le=1000)
    starts_at: datetime | None = None
    ends_at: datetime | None = None
    sponsor_name: str | None = Field(default=None, min_length=1, max_length=120)
    icon: str | None = None
    headline: str | None = Field(default=None, min_length=1, max_length=500)
    body: str | None = None
    bullets: list[str] | None = None
    cta_label: str | None = Field(default=None, min_length=1, max_length=120)
    cta_url: str | None = Field(default=None, min_length=1, max_length=500)
    discount_code: str | None = None
    discount_note: str | None = None
    match_sizes: list[str] | None = None
    match_energy_levels: list[str] | None = None
    match_age_stages: list[str] | None = None


class PartnerCampaignRead(PartnerCampaignBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PartnerCampaignResolved(BaseModel):
    id: int
    placement: str
    sponsor_name: str
    icon: str | None = None
    headline: str
    body: str
    bullets: list[str] = Field(default_factory=list)
    cta_label: str
    cta_url: str
    discount_code: str | None = None
    discount_note: str | None = None
