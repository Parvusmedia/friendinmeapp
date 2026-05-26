from app.models.enums import LeadStatus
from app.services.lead_rules import ADOPTER_CANCELLABLE, BLOCKING_LEAD_STATUSES


def test_blocking_includes_new_not_cancelled():
    assert LeadStatus.new in BLOCKING_LEAD_STATUSES
    assert LeadStatus.cancelled not in BLOCKING_LEAD_STATUSES
    assert LeadStatus.archived not in BLOCKING_LEAD_STATUSES


def test_adopter_can_cancel_early_statuses():
    assert LeadStatus.new in ADOPTER_CANCELLABLE
    assert LeadStatus.adopted not in ADOPTER_CANCELLABLE
