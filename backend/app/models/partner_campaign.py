from datetime import datetime
from typing import Any

from sqlalchemy import Boolean, DateTime, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class PartnerCampaignRecord(Base):
    __tablename__ = "partner_campaigns"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    placement: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="true")
    priority: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    starts_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    ends_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    sponsor_name: Mapped[str] = mapped_column(String(120), nullable=False)
    icon: Mapped[str | None] = mapped_column(String(16), nullable=True)
    headline: Mapped[str] = mapped_column(String(500), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    bullets: Mapped[list[Any]] = mapped_column(JSONB, nullable=False, server_default="[]")
    cta_label: Mapped[str] = mapped_column(String(120), nullable=False)
    cta_url: Mapped[str] = mapped_column(String(500), nullable=False)
    discount_code: Mapped[str | None] = mapped_column(String(64), nullable=True)
    discount_note: Mapped[str | None] = mapped_column(String(255), nullable=True)
    match_sizes: Mapped[list[Any] | None] = mapped_column(JSONB, nullable=True)
    match_energy_levels: Mapped[list[Any] | None] = mapped_column(JSONB, nullable=True)
    match_age_stages: Mapped[list[Any] | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
