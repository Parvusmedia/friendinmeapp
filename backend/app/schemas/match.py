from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import MatchLevel


class MatchListingFilters(BaseModel):
    """Filtros del listado público (preselección antes del cuestionario)."""

    size: str | None = None
    energy_level: str | None = None
    province: str | None = None
    breed: str | None = None


class MatchRunRequest(BaseModel):
    adopter_profile_id: int
    top_n: int = Field(default=5, ge=1, le=20)
    use_ai: bool = True
    dog_id: int | None = None
    listing_filters: MatchListingFilters | None = None


class MatchBreakdownRead(BaseModel):
    key: str
    label: str
    percent: int
    status: str


class MatchDogResult(BaseModel):
    dog_id: int
    compatibility_score: float
    match_level: MatchLevel
    reasons: list[str]
    warnings: list[str]
    ai_explanation: str | None = None
    breakdown: list[MatchBreakdownRead] = []


class MatchRunResponse(BaseModel):
    adopter_profile_id: int
    results: list[MatchDogResult]
    candidates_count: int = 0
    filters_applied: str | None = None


class MatchStoredRead(BaseModel):
    id: int
    dog_id: int
    compatibility_score: float
    match_level: MatchLevel
    reasons: list[Any]
    warnings: list[Any]
    ai_explanation: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
