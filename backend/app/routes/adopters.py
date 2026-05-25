from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.models.adopter import AdopterProfile
from app.schemas.adopter import (
    AdopterLookupRequest,
    AdopterLookupResponse,
    AdopterProfileCreate,
    AdopterProfileRead,
    AdopterProfileUpdate,
    AdopterSendResultsLinkRequest,
    AdopterSendResultsLinkResponse,
    AdopterVerifyTokenResponse,
    adopter_create_to_row_fields,
)
from app.services.email_service import EmailService
from app.utils.rate_limit import check_rate_limit
from app.utils.security import create_adopter_results_token, decode_adopter_results_token

router = APIRouter(prefix="/adopters", tags=["adopters"])


@router.post("/lookup", response_model=AdopterLookupResponse)
def lookup_adopter_by_email(
    payload: AdopterLookupRequest,
    request: Request,
    db: Session = Depends(get_db),
) -> AdopterLookupResponse:
    settings = get_settings()
    check_rate_limit(
        request,
        key="adopter_lookup",
        limit=settings.rate_limit_adopter_lookup_per_minute,
        window_seconds=60,
    )
    email = payload.email.strip().lower()
    row = (
        db.query(AdopterProfile)
        .filter(func.lower(AdopterProfile.email) == email)
        .order_by(AdopterProfile.created_at.desc())
        .first()
    )
    if not row:
        return AdopterLookupResponse(found=False, profile=None)
    return AdopterLookupResponse(found=True, profile=AdopterProfileRead.model_validate(row))


@router.post("/send-results-link", response_model=AdopterSendResultsLinkResponse)
def send_adopter_results_link(
    payload: AdopterSendResultsLinkRequest,
    request: Request,
    db: Session = Depends(get_db),
) -> AdopterSendResultsLinkResponse:
    settings = get_settings()
    check_rate_limit(
        request,
        key="magic_link",
        limit=settings.rate_limit_magic_link_per_hour,
        window_seconds=3600,
    )
    email = payload.email.strip().lower()
    row = (
        db.query(AdopterProfile)
        .filter(func.lower(AdopterProfile.email) == email)
        .order_by(AdopterProfile.created_at.desc())
        .first()
    )
    if not row:
        return AdopterSendResultsLinkResponse(
            sent=False,
            message="No encontramos un cuestionario con ese email. Completa el cuestionario primero.",
        )
    token = create_adopter_results_token(row.id)
    url = f"{settings.public_base_url.rstrip('/')}/resultados?adopter={row.id}&token={token}"
    sent = EmailService().send_adopter_results_link(to_email=row.email, results_url=url)
    if sent:
        return AdopterSendResultsLinkResponse(
            sent=True,
            message="Te hemos enviado un enlace a tu email para ver tus resultados.",
        )
    return AdopterSendResultsLinkResponse(
        sent=False,
        message="No pudimos enviar el email ahora. Usa el enlace de resultados si ya lo tienes guardado.",
    )


@router.get("/verify-results-token", response_model=AdopterVerifyTokenResponse)
def verify_adopter_results_token(
    token: str = Query(..., min_length=10),
) -> AdopterVerifyTokenResponse:
    adopter_id = decode_adopter_results_token(token)
    if adopter_id is None:
        return AdopterVerifyTokenResponse(valid=False, adopter_profile_id=None)
    return AdopterVerifyTokenResponse(valid=True, adopter_profile_id=adopter_id)


@router.get("/{adopter_id}", response_model=AdopterProfileRead)
def get_adopter(adopter_id: int, db: Session = Depends(get_db)) -> AdopterProfileRead:
    row = db.get(AdopterProfile, adopter_id)
    if not row:
        raise HTTPException(status_code=404, detail="Perfil no encontrado")
    return AdopterProfileRead.model_validate(row)


@router.post("", response_model=AdopterProfileRead, status_code=status.HTTP_201_CREATED)
def create_adopter(payload: AdopterProfileCreate, db: Session = Depends(get_db)) -> AdopterProfileRead:
    if not payload.consent_contact:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Se requiere consentimiento para contacto sobre adopción.",
        )
    row = AdopterProfile(**adopter_create_to_row_fields(payload))
    db.add(row)
    db.commit()
    db.refresh(row)
    return AdopterProfileRead.model_validate(row)


@router.put("/{adopter_id}", response_model=AdopterProfileRead)
def update_adopter(
    adopter_id: int,
    payload: AdopterProfileUpdate,
    db: Session = Depends(get_db),
) -> AdopterProfileRead:
    if not payload.consent_contact:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Se requiere consentimiento para contacto sobre adopción.",
        )
    row = db.get(AdopterProfile, adopter_id)
    if not row:
        raise HTTPException(status_code=404, detail="Perfil no encontrado")
    for key, value in adopter_create_to_row_fields(payload).items():
        setattr(row, key, value)
    db.commit()
    db.refresh(row)
    return AdopterProfileRead.model_validate(row)
