import csv
import io

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.models.adopter import AdopterProfile
from app.models.dog import Dog
from app.models.enums import LeadStatus, UserRole
from app.models.lead import AdoptionLead
from app.models.shelter import Shelter
from app.models.user import User
from app.schemas.lead import LeadCreate, LeadRead, LeadStatusUpdate
from app.services.email_service import EmailService
from app.utils.dependencies import require_shelter_or_admin
from app.utils.rate_limit import check_rate_limit

router = APIRouter(prefix="/leads", tags=["leads"])


@router.post("", response_model=LeadRead, status_code=status.HTTP_201_CREATED)
def create_lead(payload: LeadCreate, request: Request, db: Session = Depends(get_db)) -> AdoptionLead:
    settings = get_settings()
    check_rate_limit(
        request,
        key="leads",
        limit=settings.rate_limit_leads_per_minute,
        window_seconds=60,
    )
    adopter = db.get(AdopterProfile, payload.adopter_profile_id)
    if not adopter or not adopter.consent_contact:
        raise HTTPException(status_code=400, detail="Consentimiento de contacto no válido")
    dog = db.get(Dog, payload.dog_id)
    if not dog:
        raise HTTPException(status_code=404, detail="Perro no encontrado")
    shelter = db.get(Shelter, dog.shelter_id)
    if not shelter:
        raise HTTPException(status_code=500, detail="Refugio inconsistente")

    lead = AdoptionLead(
        adopter_profile_id=payload.adopter_profile_id,
        dog_id=payload.dog_id,
        shelter_id=dog.shelter_id,
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
        province=payload.province,
        message=payload.message,
        compatibility_score=payload.compatibility_score,
        status=LeadStatus.new,
    )
    db.add(lead)
    db.commit()
    db.refresh(lead)

    settings = get_settings()
    to_list = [shelter.email]
    if settings.admin_notify_email:
        to_list.append(settings.admin_notify_email)
    subject = f"Nuevo lead de adopción — {dog.name} ({shelter.name})"
    body = (
        f"Has recibido una solicitud de contacto para {dog.name}.\n\n"
        f"Nombre: {payload.name}\nEmail: {payload.email}\nTeléfono: {payload.phone}\n"
        f"Provincia: {payload.province}\nCompatibilidad (orientativa): {payload.compatibility_score}\n\n"
        f"Mensaje:\n{payload.message}\n"
    )
    EmailService().send_lead_notification(to_emails=to_list, subject=subject, body=body)

    return lead


@router.get("", response_model=list[LeadRead])
def list_leads(
    db: Session = Depends(get_db),
    user: User = Depends(require_shelter_or_admin),
) -> list[AdoptionLead]:
    q = db.query(AdoptionLead)
    if user.role == UserRole.shelter:
        q = q.filter(AdoptionLead.shelter_id == user.shelter_id)
    return q.order_by(AdoptionLead.created_at.desc()).all()


@router.get("/export", response_class=Response)
def export_leads_csv(
    db: Session = Depends(get_db),
    user: User = Depends(require_shelter_or_admin),
) -> Response:
    q = db.query(AdoptionLead)
    if user.role == UserRole.shelter:
        q = q.filter(AdoptionLead.shelter_id == user.shelter_id)
    rows = q.order_by(AdoptionLead.created_at.desc()).all()
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(
        [
            "id",
            "dog_id",
            "shelter_id",
            "name",
            "email",
            "phone",
            "province",
            "message",
            "compatibility_score",
            "status",
            "created_at",
        ]
    )
    for r in rows:
        w.writerow(
            [
                r.id,
                r.dog_id,
                r.shelter_id,
                r.name,
                r.email,
                r.phone,
                r.province,
                r.message,
                r.compatibility_score,
                r.status.value,
                r.created_at.isoformat(),
            ]
        )
    return Response(
        content=buf.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=leads.csv"},
    )


@router.get("/{lead_id}", response_model=LeadRead)
def get_lead(
    lead_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_shelter_or_admin),
) -> AdoptionLead:
    lead = db.get(AdoptionLead, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead no encontrado")
    if user.role == UserRole.shelter and lead.shelter_id != user.shelter_id:
        raise HTTPException(status_code=403, detail="No autorizado")
    return lead


@router.patch("/{lead_id}/status", response_model=LeadRead)
def patch_lead_status(
    lead_id: int,
    payload: LeadStatusUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_shelter_or_admin),
) -> AdoptionLead:
    lead = db.get(AdoptionLead, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead no encontrado")
    if user.role == UserRole.shelter and lead.shelter_id != user.shelter_id:
        raise HTTPException(status_code=403, detail="No autorizado")
    lead.status = payload.status
    db.commit()
    db.refresh(lead)
    return lead
