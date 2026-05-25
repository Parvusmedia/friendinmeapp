import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.models.enums import ShelterApplicationStatus
from app.models.shelter import Shelter
from app.models.shelter_application import ShelterApplication
from app.models.user import User
from app.schemas.shelter_application import (
    ShelterApplicationApproveResponse,
    ShelterApplicationCreate,
    ShelterApplicationRead,
    ShelterApplicationReject,
)
from app.services.email_service import EmailService
from app.utils.dependencies import require_admin

logger = logging.getLogger("friendinme")
router = APIRouter(prefix="/shelter-applications", tags=["shelter-applications"])


@router.post("", response_model=ShelterApplicationRead, status_code=status.HTTP_201_CREATED)
def create_application(payload: ShelterApplicationCreate, db: Session = Depends(get_db)) -> ShelterApplication:
    pending = (
        db.query(ShelterApplication)
        .filter(
            ShelterApplication.email == payload.email.lower(),
            ShelterApplication.status == ShelterApplicationStatus.pending,
        )
        .first()
    )
    if pending:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya hay una solicitud pendiente con este email.",
        )

    row = ShelterApplication(
        organization_name=payload.organization_name.strip(),
        contact_name=payload.contact_name.strip(),
        email=payload.email.lower(),
        phone=payload.phone.strip(),
        province=payload.province.strip(),
        city=payload.city.strip(),
        address=(payload.address or "").strip(),
        website=(payload.website or "").strip() or None,
        description=(payload.description or "").strip(),
        message=(payload.message or "").strip(),
        status=ShelterApplicationStatus.pending,
    )
    db.add(row)
    db.commit()
    db.refresh(row)

    settings = get_settings()
    if settings.admin_notify_email:
        body = (
            f"Nueva solicitud de alta de refugio #{row.id}\n"
            f"Organización: {row.organization_name}\n"
            f"Contacto: {row.contact_name} ({row.email}, {row.phone})\n"
            f"Ubicación: {row.city}, {row.province}\n"
            f"Mensaje: {row.message or '—'}\n"
        )
        try:
            EmailService().send_lead_notification(
                to_emails=[settings.admin_notify_email],
                subject=f"[FriendInMe] Solicitud refugio: {row.organization_name}",
                body=body,
            )
        except Exception:
            logger.exception("No se pudo notificar al admin de la solicitud %s", row.id)

    return row


@router.get("", response_model=list[ShelterApplicationRead])
def list_applications(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
    status_filter: ShelterApplicationStatus | None = Query(None, alias="status"),
) -> list[ShelterApplication]:
    q = db.query(ShelterApplication).order_by(ShelterApplication.created_at.desc())
    if status_filter:
        q = q.filter(ShelterApplication.status == status_filter)
    return q.all()


@router.post("/{application_id}/approve", response_model=ShelterApplicationApproveResponse)
def approve_application(
    application_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> ShelterApplicationApproveResponse:
    app_row = db.get(ShelterApplication, application_id)
    if not app_row:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")
    if app_row.status != ShelterApplicationStatus.pending:
        raise HTTPException(status_code=400, detail="La solicitud ya fue revisada")

    shelter = Shelter(
        name=app_row.organization_name,
        email=app_row.email,
        phone=app_row.phone,
        province=app_row.province,
        city=app_row.city,
        address=app_row.address or "",
        description=app_row.description or "",
        website=app_row.website,
    )
    db.add(shelter)
    db.flush()

    app_row.status = ShelterApplicationStatus.approved
    app_row.created_shelter_id = shelter.id
    app_row.reviewed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(app_row)

    return ShelterApplicationApproveResponse(application=app_row, shelter_id=shelter.id)


@router.post("/{application_id}/reject", response_model=ShelterApplicationRead)
def reject_application(
    application_id: int,
    payload: ShelterApplicationReject,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> ShelterApplication:
    app_row = db.get(ShelterApplication, application_id)
    if not app_row:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")
    if app_row.status != ShelterApplicationStatus.pending:
        raise HTTPException(status_code=400, detail="La solicitud ya fue revisada")

    app_row.status = ShelterApplicationStatus.rejected
    app_row.admin_notes = (payload.admin_notes or "").strip()
    app_row.reviewed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(app_row)
    return app_row
