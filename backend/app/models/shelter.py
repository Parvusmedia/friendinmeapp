from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Shelter(Base):
    __tablename__ = "shelters"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str] = mapped_column(String(64), nullable=False)
    province: Mapped[str] = mapped_column(String(128), nullable=False)
    city: Mapped[str] = mapped_column(String(128), nullable=False)
    address: Mapped[str | None] = mapped_column(String(512), nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=False, server_default="")
    website: Mapped[str | None] = mapped_column(String(512), nullable=True)
    instagram: Mapped[str] = mapped_column(String(255), nullable=False, server_default="")
    contact_person: Mapped[str] = mapped_column(String(255), nullable=False, server_default="")
    contact_mobile: Mapped[str] = mapped_column(String(64), nullable=False, server_default="")
    whatsapp: Mapped[str] = mapped_column(String(64), nullable=False, server_default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    users = relationship("User", back_populates="shelter")
    dogs = relationship("Dog", back_populates="shelter")
    leads = relationship("AdoptionLead", back_populates="shelter")
