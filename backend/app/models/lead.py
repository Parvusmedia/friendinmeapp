from datetime import datetime

from sqlalchemy import DateTime, Enum, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.enums import LeadStatus


class AdoptionLead(Base):
    __tablename__ = "adoption_leads"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    adopter_profile_id: Mapped[int] = mapped_column(ForeignKey("adopter_profiles.id"), nullable=False, index=True)
    dog_id: Mapped[int] = mapped_column(ForeignKey("dogs.id"), nullable=False, index=True)
    shelter_id: Mapped[int] = mapped_column(ForeignKey("shelters.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str] = mapped_column(String(64), nullable=False)
    province: Mapped[str] = mapped_column(String(128), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False, default="")
    compatibility_score: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[LeadStatus] = mapped_column(
        Enum(LeadStatus, name="leadstatus"), nullable=False, default=LeadStatus.new
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    adopter_profile = relationship("AdopterProfile", back_populates="leads")
    dog = relationship("Dog", back_populates="leads")
    shelter = relationship("Shelter", back_populates="leads")
