from datetime import datetime
from typing import Any

from sqlalchemy import DateTime, Enum, Float, ForeignKey, Integer, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.enums import MatchLevel


class MatchResult(Base):
    __tablename__ = "match_results"
    __table_args__ = (UniqueConstraint("adopter_profile_id", "dog_id", name="uq_match_adopter_dog"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    adopter_profile_id: Mapped[int] = mapped_column(ForeignKey("adopter_profiles.id"), nullable=False, index=True)
    dog_id: Mapped[int] = mapped_column(ForeignKey("dogs.id"), nullable=False, index=True)
    compatibility_score: Mapped[float] = mapped_column(Float, nullable=False)
    match_level: Mapped[MatchLevel] = mapped_column(Enum(MatchLevel, name="matchlevel"), nullable=False)
    reasons: Mapped[list[Any]] = mapped_column(JSONB, nullable=False, server_default="[]")
    warnings: Mapped[list[Any]] = mapped_column(JSONB, nullable=False, server_default="[]")
    ai_explanation: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    adopter_profile = relationship("AdopterProfile", back_populates="match_results")
    dog = relationship("Dog", back_populates="match_results")
