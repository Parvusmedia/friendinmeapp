from datetime import datetime, timedelta, timezone

from app.models.partner_campaign import PartnerCampaignRecord
from app.services.partner_campaign_service import (
    is_campaign_scheduled_active,
    resolve_campaign,
)
from app.models.enums import DogSize
from tests.conftest import make_dog


def _campaign(**kwargs) -> PartnerCampaignRecord:
    data = dict(
        id=1,
        name="Test",
        placement="dog_detail_footer",
        active=True,
        priority=10,
        starts_at=None,
        ends_at=None,
        sponsor_name="Partner",
        icon=None,
        headline="Hola {dogName}",
        body="Cuerpo {sizeLabel}",
        bullets=["Línea {energyLabel}"],
        cta_label="Ver",
        cta_url="https://example.com",
        discount_code="SAVE10",
        discount_note="Código {discountCode}",
        match_sizes=None,
        match_energy_levels=None,
        match_age_stages=None,
    )
    data.update(kwargs)
    return PartnerCampaignRecord(**data)


def test_schedule_inactive_when_future_start():
    now = datetime(2026, 1, 15, tzinfo=timezone.utc)
    c = _campaign(starts_at=now + timedelta(days=1))
    assert is_campaign_scheduled_active(c, now) is False


def test_schedule_inactive_when_past_end():
    now = datetime(2026, 1, 15, tzinfo=timezone.utc)
    c = _campaign(ends_at=now - timedelta(hours=1))
    assert is_campaign_scheduled_active(c, now) is False


def test_resolve_interpolates_dog_fields():
    c = _campaign()
    dog = make_dog(name="Lola", size=DogSize.medium)
    out = resolve_campaign(c, dog=dog)
    assert "Lola" in out.headline
    assert out.discount_note and "SAVE10" in out.discount_note
