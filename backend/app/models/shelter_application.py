from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.models.enums import ShelterApplicationStatus


class ShelterApplication(Base):
    __tablename__ = "shelter_applications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    organization_name: Mapped[str] = mapped_column(String(255), nullable=False)
    contact_name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    phone: Mapped[str] = mapped_column(String(64), nullable=False)
    province: Mapped[str] = mapped_column(String(128), nullable=False)
    city: Mapped[str] = mapped_column(String(128), nullable=False)
    address: Mapped[str] = mapped_column(String(512), nullable=False, server_default="")
    website: Mapped[str | None] = mapped_column(String(512), nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=False, server_default="")
    message: Mapped[str] = mapped_column(Text, nullable=False, server_default="")
    status: Mapped[ShelterApplicationStatus] = mapped_column(
        Enum(ShelterApplicationStatus, name="shelterapplicationstatus"),
        nullable=False,
        server_default=ShelterApplicationStatus.pending.value,
    )
    admin_notes: Mapped[str] = mapped_column(Text, nullable=False, server_default="")
    created_shelter_id: Mapped[int | None] = mapped_column(ForeignKey("shelters.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
