from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.enums import (
    DogExperience,
    EnergyLevel,
    EnergyPreference,
    HousingType,
    HoursAway,
)


class AdopterProfile(Base):
    __tablename__ = "adopter_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str] = mapped_column(String(64), nullable=False)
    province: Mapped[str] = mapped_column(String(128), nullable=False)
    city: Mapped[str] = mapped_column(String(128), nullable=False)
    housing_type: Mapped[HousingType] = mapped_column(Enum(HousingType, name="housingtype"), nullable=False)
    has_children: Mapped[bool] = mapped_column(Boolean, nullable=False)
    children_age_range: Mapped[str | None] = mapped_column(String(128), nullable=True)
    has_other_dogs: Mapped[bool] = mapped_column(Boolean, nullable=False)
    has_cats: Mapped[bool] = mapped_column(Boolean, nullable=False)
    previous_dog_experience: Mapped[DogExperience] = mapped_column(
        Enum(DogExperience, name="dogexperience"), nullable=False
    )
    hours_away_from_home: Mapped[HoursAway] = mapped_column(Enum(HoursAway, name="hoursaway"), nullable=False)
    activity_level: Mapped[EnergyLevel] = mapped_column(Enum(EnergyLevel, name="adopter_activity"), nullable=False)
    preferred_size: Mapped[str] = mapped_column(String(64), nullable=False, server_default="no_preference")
    preferred_energy: Mapped[EnergyPreference] = mapped_column(
        Enum(EnergyPreference, name="energypreference"), nullable=False
    )
    adoption_reason: Mapped[str] = mapped_column(Text, nullable=False, server_default="")
    important_notes: Mapped[str] = mapped_column(Text, nullable=False, server_default="")
    province_preference: Mapped[str] = mapped_column(String(128), nullable=False, server_default="")
    breed_preference: Mapped[str] = mapped_column(String(512), nullable=False, server_default="")
    max_distance_km: Mapped[int | None] = mapped_column(Integer, nullable=True)
    consent_marketing: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    consent_contact: Mapped[bool] = mapped_column(Boolean, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    leads = relationship("AdoptionLead", back_populates="adopter_profile")
    match_results = relationship("MatchResult", back_populates="adopter_profile")
