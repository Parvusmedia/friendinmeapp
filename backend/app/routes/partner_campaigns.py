from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.dog import Dog
from app.models.partner_campaign import PartnerCampaignRecord
from app.models.user import User
from app.schemas.partner_campaign import (
    PartnerCampaignCreate,
    PartnerCampaignRead,
    PartnerCampaignResolved,
    PartnerCampaignUpdate,
)
from app.services.partner_campaign_service import PLACEMENTS, pick_campaign_for_placement
from app.utils.dependencies import require_admin

router = APIRouter(prefix="/partner-campaigns", tags=["partner-campaigns"])


@router.get("/resolve", response_model=PartnerCampaignResolved | None)
def resolve_partner_campaign(
    placement: str = Query(..., min_length=1),
    dog_id: int | None = Query(None, ge=1),
    dog_name: str | None = Query(None),
    db: Session = Depends(get_db),
) -> PartnerCampaignResolved | None:
    if placement not in PLACEMENTS:
        raise HTTPException(status_code=400, detail="Ubicación no válida")
    dog: Dog | None = None
    if dog_id:
        dog = db.get(Dog, dog_id)
        if not dog:
            raise HTTPException(status_code=404, detail="Perro no encontrado")
    return pick_campaign_for_placement(db, placement, dog=dog, dog_name=dog_name)


@router.get("", response_model=list[PartnerCampaignRead])
def list_partner_campaigns_admin(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> list[PartnerCampaignRecord]:
    return (
        db.query(PartnerCampaignRecord)
        .order_by(PartnerCampaignRecord.placement.asc(), PartnerCampaignRecord.priority.desc())
        .all()
    )


@router.post("", response_model=PartnerCampaignRead, status_code=201)
def create_partner_campaign(
    payload: PartnerCampaignCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> PartnerCampaignRecord:
    if payload.placement not in PLACEMENTS:
        raise HTTPException(status_code=400, detail="Ubicación no válida")
    row = PartnerCampaignRecord(**payload.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.get("/{campaign_id}", response_model=PartnerCampaignRead)
def get_partner_campaign_admin(
    campaign_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> PartnerCampaignRecord:
    row = db.get(PartnerCampaignRecord, campaign_id)
    if not row:
        raise HTTPException(status_code=404, detail="Campaña no encontrada")
    return row


@router.patch("/{campaign_id}", response_model=PartnerCampaignRead)
def update_partner_campaign(
    campaign_id: int,
    payload: PartnerCampaignUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> PartnerCampaignRecord:
    row = db.get(PartnerCampaignRecord, campaign_id)
    if not row:
        raise HTTPException(status_code=404, detail="Campaña no encontrada")
    data = payload.model_dump(exclude_unset=True)
    if "placement" in data and data["placement"] not in PLACEMENTS:
        raise HTTPException(status_code=400, detail="Ubicación no válida")
    for key, val in data.items():
        setattr(row, key, val)
    db.commit()
    db.refresh(row)
    return row


@router.delete("/{campaign_id}", status_code=204)
def delete_partner_campaign(
    campaign_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> None:
    row = db.get(PartnerCampaignRecord, campaign_id)
    if not row:
        raise HTTPException(status_code=404, detail="Campaña no encontrada")
    db.delete(row)
    db.commit()
