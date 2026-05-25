import csv
import io
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.adopter import AdopterProfile
from app.models.dog import Dog
from app.models.enums import DogStatus, Sociability, TriState
from app.models.lead import AdoptionLead
from app.models.match_result import MatchResult
from app.models.shelter import Shelter
from app.schemas.admin import AdopterAdminDetail, AdopterAdminListItem, AdopterLeadBrief, AdminStats
from app.schemas.adopter import AdopterProfileRead
from app.models.user import User
from app.utils.dependencies import require_admin

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/stats", response_model=AdminStats)
def admin_stats(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> AdminStats:
    active_dogs = db.query(func.count(Dog.id)).filter(Dog.status == DogStatus.available).scalar() or 0
    shelters_count = db.query(func.count(Shelter.id)).scalar() or 0
    leads_count = db.query(func.count(AdoptionLead.id)).scalar() or 0
    adopters_count = db.query(func.count(AdopterProfile.id)).scalar() or 0

    top_dogs = (
        db.query(Dog.id, Dog.name, func.count(AdoptionLead.id).label("c"))
        .join(AdoptionLead, AdoptionLead.dog_id == Dog.id)
        .group_by(Dog.id, Dog.name)
        .order_by(func.count(AdoptionLead.id).desc())
        .limit(5)
        .all()
    )
    top_contacted_dogs = [{"dog_id": d[0], "name": d[1], "leads": int(d[2])} for d in top_dogs]

    top_provinces = (
        db.query(AdoptionLead.province, func.count(AdoptionLead.id).label("c"))
        .group_by(AdoptionLead.province)
        .order_by(func.count(AdoptionLead.id).desc())
        .limit(8)
        .all()
    )
    top_provinces_interest = [{"province": p[0], "leads": int(p[1])} for p in top_provinces]

    avg_score = db.query(func.avg(AdoptionLead.compatibility_score)).scalar()
    since = datetime.now(timezone.utc) - timedelta(days=7)
    leads_week = (
        db.query(func.count(AdoptionLead.id)).filter(AdoptionLead.created_at >= since).scalar() or 0
    )
    adopters_week = (
        db.query(func.count(AdopterProfile.id)).filter(AdopterProfile.created_at >= since).scalar() or 0
    )
    dogs_without_photo = (
        db.query(func.count(Dog.id))
        .filter(Dog.status == DogStatus.available, or_(Dog.main_image_url.is_(None), Dog.main_image_url == ""))
        .scalar()
        or 0
    )
    dogs_incomplete = (
        db.query(func.count(Dog.id))
        .filter(
            Dog.status == DogStatus.available,
            or_(
                Dog.good_with_children == TriState.unknown,
                Dog.sociability_with_cats == Sociability.unknown,
                Dog.can_live_in_apartment == TriState.unknown,
                Dog.main_image_url.is_(None),
                Dog.main_image_url == "",
            ),
        )
        .scalar()
        or 0
    )

    return AdminStats(
        active_dogs=int(active_dogs),
        shelters_count=int(shelters_count),
        leads_count=int(leads_count),
        adopters_count=int(adopters_count),
        top_contacted_dogs=top_contacted_dogs,
        top_provinces_interest=top_provinces_interest,
        avg_compatibility_score=float(avg_score) if avg_score is not None else None,
        leads_last_7_days=int(leads_week),
        adopters_last_7_days=int(adopters_week),
        dogs_without_photo=int(dogs_without_photo),
        dogs_incomplete_ficha=int(dogs_incomplete),
    )


@router.get("/adopters/export", response_class=Response)
def export_adopters_csv(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> Response:
    rows = db.query(AdopterProfile).order_by(AdopterProfile.created_at.desc()).all()
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(
        [
            "id",
            "name",
            "email",
            "phone",
            "city",
            "province",
            "consent_contact",
            "consent_marketing",
            "created_at",
        ]
    )
    for r in rows:
        w.writerow(
            [
                r.id,
                r.name,
                r.email,
                r.phone,
                r.city,
                r.province,
                r.consent_contact,
                r.consent_marketing,
                r.created_at.isoformat() if r.created_at else "",
            ]
        )
    return Response(
        content=buf.getvalue(),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": 'attachment; filename="adopters.csv"'},
    )


@router.get("/adopters", response_model=list[AdopterAdminListItem])
def list_adopters_admin(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> list[AdopterAdminListItem]:
    rows = (
        db.query(
            AdopterProfile,
            func.count(func.distinct(AdoptionLead.id)).label("leads_count"),
            func.count(func.distinct(MatchResult.id)).label("matches_count"),
        )
        .outerjoin(AdoptionLead, AdoptionLead.adopter_profile_id == AdopterProfile.id)
        .outerjoin(MatchResult, MatchResult.adopter_profile_id == AdopterProfile.id)
        .group_by(AdopterProfile.id)
        .order_by(AdopterProfile.created_at.desc())
        .all()
    )
    out: list[AdopterAdminListItem] = []
    for profile, leads_count, matches_count in rows:
        out.append(
            AdopterAdminListItem(
                id=profile.id,
                name=profile.name,
                email=profile.email,
                phone=profile.phone,
                city=profile.city,
                province=profile.province,
                created_at=profile.created_at,
                consent_contact=profile.consent_contact,
                consent_marketing=profile.consent_marketing,
                leads_count=int(leads_count or 0),
                matches_count=int(matches_count or 0),
            )
        )
    return out


@router.get("/adopters/{adopter_id}", response_model=AdopterAdminDetail)
def get_adopter_admin(
    adopter_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> AdopterAdminDetail:
    profile = db.get(AdopterProfile, adopter_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Perfil no encontrado")

    leads_count = (
        db.query(func.count(AdoptionLead.id)).filter(AdoptionLead.adopter_profile_id == adopter_id).scalar() or 0
    )
    matches_count = (
        db.query(func.count(MatchResult.id)).filter(MatchResult.adopter_profile_id == adopter_id).scalar() or 0
    )

    lead_rows = (
        db.query(AdoptionLead, Dog.name)
        .join(Dog, Dog.id == AdoptionLead.dog_id)
        .filter(AdoptionLead.adopter_profile_id == adopter_id)
        .order_by(AdoptionLead.created_at.desc())
        .all()
    )
    leads = [
        AdopterLeadBrief(
            id=lead.id,
            dog_id=lead.dog_id,
            dog_name=dog_name,
            compatibility_score=lead.compatibility_score,
            status=lead.status.value if hasattr(lead.status, "value") else str(lead.status),
            message=lead.message or "",
            created_at=lead.created_at,
        )
        for lead, dog_name in lead_rows
    ]

    return AdopterAdminDetail(
        profile=AdopterProfileRead.model_validate(profile),
        leads_count=int(leads_count),
        matches_count=int(matches_count),
        leads=leads,
    )
