from datetime import datetime
from typing import Any

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.enums import DogSex, DogSize, DogStatus, EnergyLevel, Sociability, TriState


class Dog(Base):
    __tablename__ = "dogs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    shelter_id: Mapped[int] = mapped_column(ForeignKey("shelters.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    breed: Mapped[str] = mapped_column(String(128), nullable=False, server_default="")
    age_estimate: Mapped[str] = mapped_column(String(64), nullable=False)
    size: Mapped[DogSize] = mapped_column(Enum(DogSize, name="dogsize"), nullable=False)
    sex: Mapped[DogSex] = mapped_column(Enum(DogSex, name="dogsex"), nullable=False)
    province: Mapped[str] = mapped_column(String(128), nullable=False)
    city: Mapped[str] = mapped_column(String(128), nullable=False)
    energy_level: Mapped[EnergyLevel] = mapped_column(Enum(EnergyLevel, name="energylevel"), nullable=False)
    sociability_with_dogs: Mapped[Sociability] = mapped_column(
        Enum(Sociability, name="sociabilitydogs"), nullable=False
    )
    sociability_with_cats: Mapped[Sociability] = mapped_column(
        Enum(Sociability, name="sociabilitycats"), nullable=False
    )
    good_with_children: Mapped[TriState] = mapped_column(Enum(TriState, name="tristate_children"), nullable=False)
    can_live_in_apartment: Mapped[TriState] = mapped_column(
        Enum(TriState, name="tristate_apartment"), nullable=False
    )
    needs_experience: Mapped[TriState] = mapped_column(Enum(TriState, name="tristate_experience"), nullable=False)
    can_be_alone_hours: Mapped[Sociability] = mapped_column(
        Enum(Sociability, name="sociabilityalone"), nullable=False
    )
    medical_needs: Mapped[str] = mapped_column(Text, nullable=False, server_default="")
    behaviour_notes: Mapped[str] = mapped_column(Text, nullable=False, server_default="")
    story: Mapped[str] = mapped_column(Text, nullable=False, server_default="")
    ideal_home: Mapped[str] = mapped_column(Text, nullable=False, server_default="")
    status: Mapped[DogStatus] = mapped_column(
        Enum(DogStatus, name="dogstatus"), nullable=False, server_default="available"
    )
    main_image_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    images: Mapped[list[Any]] = mapped_column(JSONB, nullable=False, server_default="[]")
    ai_generated_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    shelter = relationship("Shelter", back_populates="dogs")
    leads = relationship("AdoptionLead", back_populates="dog")
    match_results = relationship("MatchResult", back_populates="dog")
