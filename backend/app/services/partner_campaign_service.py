"""Resolución de campañas partner para la web pública."""

from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Session

from app.models.dog import Dog
from app.models.partner_campaign import PartnerCampaignRecord
from app.schemas.partner_campaign import PartnerCampaignResolved
from app.utils.age_preferences import age_stage_key, estimate_age_months

PLACEMENTS = frozenset(
    {
        "dog_detail_footer",
        "match_after_summary",
        "lead_success",
        "lead_list_pending",
    }
)

SIZE_ES = {"small": "Pequeño", "medium": "Mediano", "large": "Grande"}
ENERGY_ES = {"low": "Baja", "medium": "Media", "high": "Alta"}


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def is_campaign_scheduled_active(campaign: PartnerCampaignRecord, now: datetime | None = None) -> bool:
    if not campaign.active:
        return False
    now = now or _utcnow()
    if campaign.starts_at and now < campaign.starts_at:
        return False
    if campaign.ends_at and now > campaign.ends_at:
        return False
    return True


def _product_hint(dog: Dog | None) -> str:
    if not dog:
        return "NutriFriend (equilibrada)"
    e = dog.energy_level.value if hasattr(dog.energy_level, "value") else str(dog.energy_level)
    size = dog.size.value if hasattr(dog.size, "value") else str(dog.size)
    if e == "high":
        return "NutriActive (alta energía)"
    if e == "low":
        return "NutriCalm (baja energía)"
    if size == "small":
        return "NutriSmall"
    if size == "large":
        return "NutriLarge"
    return "NutriFriend (equilibrada)"


def build_template_context(dog: Dog | None, dog_name: str | None = None) -> dict[str, str]:
    name = dog_name or (dog.name if dog else "tu perro")
    breed = dog.breed if dog else "su raza"
    size = dog.size.value if dog and hasattr(dog.size, "value") else (str(dog.size) if dog else "")
    energy = (
        dog.energy_level.value
        if dog and hasattr(dog.energy_level, "value")
        else (str(dog.energy_level) if dog else "")
    )
    age_raw = dog.age_estimate if dog else ""
    stage = age_stage_key(age_raw) if age_raw else ""
    age_label = age_raw or "su edad"
    return {
        "dogName": name,
        "breed": breed or "su raza",
        "sizeLabel": SIZE_ES.get(size, size or "su tamaño"),
        "energyLabel": ENERGY_ES.get(energy, energy or "su energía"),
        "ageLabel": age_label,
        "ageStage": stage or "",
        "productName": _product_hint(dog),
        "discountCode": "",
    }


def interpolate(text: str, ctx: dict[str, str]) -> str:
    import re

    return re.sub(r"\{(\w+)\}", lambda m: ctx.get(m.group(1), m.group(0)), text)


def _campaign_matches_dog(campaign: PartnerCampaignRecord, dog: Dog | None) -> bool:
    if not dog:
        return not (campaign.match_sizes or campaign.match_energy_levels or campaign.match_age_stages)
    size = dog.size.value if hasattr(dog.size, "value") else str(dog.size)
    energy = dog.energy_level.value if hasattr(dog.energy_level, "value") else str(dog.energy_level)
    if campaign.match_sizes and size not in campaign.match_sizes:
        return False
    if campaign.match_energy_levels and energy not in campaign.match_energy_levels:
        return False
    if campaign.match_age_stages:
        stage = age_stage_key(dog.age_estimate or "")
        if stage and stage not in campaign.match_age_stages:
            return False
    return True


def resolve_campaign(
    campaign: PartnerCampaignRecord,
    *,
    dog: Dog | None = None,
    dog_name: str | None = None,
) -> PartnerCampaignResolved:
    ctx = build_template_context(dog, dog_name)
    ctx["discountCode"] = campaign.discount_code or ""
    bullets = campaign.bullets if isinstance(campaign.bullets, list) else []
    return PartnerCampaignResolved(
        id=campaign.id,
        placement=campaign.placement,
        sponsor_name=campaign.sponsor_name,
        icon=campaign.icon,
        headline=interpolate(campaign.headline, ctx),
        body=interpolate(campaign.body, ctx),
        bullets=[interpolate(str(b), ctx) for b in bullets if str(b).strip()],
        cta_label=campaign.cta_label,
        cta_url=campaign.cta_url,
        discount_code=campaign.discount_code,
        discount_note=interpolate(campaign.discount_note, ctx) if campaign.discount_note else None,
    )


def pick_campaign_for_placement(
    db: Session,
    placement: str,
    *,
    dog: Dog | None = None,
    dog_name: str | None = None,
    now: datetime | None = None,
) -> PartnerCampaignResolved | None:
    if placement not in PLACEMENTS:
        return None
    now = now or _utcnow()
    rows = (
        db.query(PartnerCampaignRecord)
        .filter(PartnerCampaignRecord.placement == placement)
        .order_by(PartnerCampaignRecord.priority.desc(), PartnerCampaignRecord.id.desc())
        .all()
    )
    for row in rows:
        if not is_campaign_scheduled_active(row, now):
            continue
        if not _campaign_matches_dog(row, dog):
            continue
        return resolve_campaign(row, dog=dog, dog_name=dog_name)
    return None
