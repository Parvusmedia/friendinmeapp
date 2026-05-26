from sqlalchemy.orm import Session

from app.models.adopter import AdopterProfile
from app.models.dog import Dog
from app.models.enums import LeadStatus
from app.models.lead import AdoptionLead
from app.models.shelter import Shelter

# Bloquea un segundo envío para el mismo perro mientras la solicitud sigue abierta.
BLOCKING_LEAD_STATUSES = frozenset(
    {
        LeadStatus.new,
        LeadStatus.contacted,
        LeadStatus.in_process,
        LeadStatus.adopted,
        LeadStatus.rejected,
    }
)

ADOPTER_CANCELLABLE = frozenset({LeadStatus.new, LeadStatus.contacted, LeadStatus.in_process})


def find_blocking_lead(db: Session, adopter_profile_id: int, dog_id: int) -> AdoptionLead | None:
    return (
        db.query(AdoptionLead)
        .filter(
            AdoptionLead.adopter_profile_id == adopter_profile_id,
            AdoptionLead.dog_id == dog_id,
            AdoptionLead.status.in_(BLOCKING_LEAD_STATUSES),
        )
        .order_by(AdoptionLead.created_at.desc())
        .first()
    )


def lead_to_adopter_dict(lead: AdoptionLead, dog: Dog, shelter: Shelter) -> dict:
    return {
        "id": lead.id,
        "adopter_profile_id": lead.adopter_profile_id,
        "dog_id": lead.dog_id,
        "shelter_id": lead.shelter_id,
        "name": lead.name,
        "email": lead.email,
        "phone": lead.phone,
        "province": lead.province,
        "message": lead.message,
        "compatibility_score": lead.compatibility_score,
        "status": lead.status,
        "created_at": lead.created_at,
        "updated_at": lead.updated_at,
        "dog_name": dog.name,
        "dog_main_image_url": dog.main_image_url,
        "shelter_name": shelter.name,
    }
