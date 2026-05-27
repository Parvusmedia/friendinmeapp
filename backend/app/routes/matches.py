from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.models.adopter import AdopterProfile
from app.models.dog import Dog
from app.models.enums import DogStatus
from app.models.match_result import MatchResult
from app.schemas.match import (
    MatchBreakdownRead,
    MatchDogResult,
    MatchRunRequest,
    MatchRunResponse,
    MatchStoredRead,
)
from app.services.ai_service import AIService
from app.services.match_candidates import (
    criteria_from_listing,
    load_match_candidate_dogs,
    match_results_sort_key,
    province_proximity_rank,
)
from app.services.match_engine import MatchComputation, compute_match
from app.utils.rate_limit import check_rate_limit

router = APIRouter(prefix="/matches", tags=["matches"])


def _comp_to_result(comp: MatchComputation, *, ai_explanation: str | None = None) -> MatchDogResult:
    breakdown = [
        MatchBreakdownRead(key=b.key, label=b.label, percent=b.percent, status=b.status)
        for b in (comp.breakdown or [])
    ]
    return MatchDogResult(
        dog_id=comp.dog_id,
        compatibility_score=comp.compatibility_score,
        match_level=comp.match_level,
        reasons=comp.reasons,
        warnings=comp.warnings,
        ai_explanation=ai_explanation,
        breakdown=breakdown,
    )


@router.get("/preview", response_model=MatchDogResult)
def preview_match(
    adopter_profile_id: int = Query(..., ge=1),
    dog_id: int = Query(..., ge=1),
    db: Session = Depends(get_db),
) -> MatchDogResult:
    adopter = db.get(AdopterProfile, adopter_profile_id)
    if not adopter:
        raise HTTPException(status_code=404, detail="Perfil adoptante no encontrado")
    dog = db.get(Dog, dog_id)
    if not dog:
        raise HTTPException(status_code=404, detail="Perro no encontrado")
    comp = compute_match(adopter, dog)
    return _comp_to_result(comp)


@router.get("/candidates")
def candidates_count(
    adopter_profile_id: int = Query(..., ge=1),
    db: Session = Depends(get_db),
) -> dict:
    adopter = db.get(AdopterProfile, adopter_profile_id)
    if not adopter:
        raise HTTPException(status_code=404, detail="Perfil adoptante no encontrado")
    dogs, criteria = load_match_candidate_dogs(db, adopter=adopter, dog_id=None, listing=None)
    return {
        "adopter_profile_id": adopter.id,
        "candidates_count": len(dogs),
        "filters_applied": criteria.summary_es() if criteria.is_restrictive() else None,
    }


@router.post("", response_model=MatchRunResponse)
async def run_matches(
    payload: MatchRunRequest,
    request: Request,
    db: Session = Depends(get_db),
) -> MatchRunResponse:
    settings = get_settings()
    check_rate_limit(
        request,
        key="matches",
        limit=settings.rate_limit_matches_per_minute,
        window_seconds=60,
    )
    adopter = db.get(AdopterProfile, payload.adopter_profile_id)
    if not adopter:
        raise HTTPException(status_code=404, detail="Perfil adoptante no encontrado")

    db.query(MatchResult).filter(MatchResult.adopter_profile_id == adopter.id).delete(synchronize_session=False)
    db.commit()

    listing = None
    if payload.listing_filters:
        lf = payload.listing_filters
        listing = criteria_from_listing(
            size=lf.size,
            energy_level=lf.energy_level,
            province=lf.province,
            breed=lf.breed,
        )

    dogs, criteria = load_match_candidate_dogs(
        db,
        adopter=adopter,
        dog_id=payload.dog_id,
        listing=listing,
    )

    if payload.dog_id is not None and not dogs:
        raise HTTPException(status_code=404, detail="Perro no disponible para match")

    if not dogs:
        return MatchRunResponse(
            adopter_profile_id=adopter.id,
            results=[],
            candidates_count=0,
            filters_applied=criteria.summary_es() if criteria.is_restrictive() else None,
        )

    ai = AIService()
    pref_province = criteria.province
    computations: list[tuple[Dog, MatchComputation]] = [(dog, compute_match(adopter, dog)) for dog in dogs]
    computations.sort(
        key=lambda x: match_results_sort_key(
            x[0], x[1].compatibility_score, preferred_province=pref_province
        )
    )
    top_slice = computations[: payload.top_n]

    for dog, comp in top_slice:
        explanation = None
        if payload.use_ai:
            explanation = await ai.explain_match(dog, comp)
        db.add(
            MatchResult(
                adopter_profile_id=adopter.id,
                dog_id=dog.id,
                compatibility_score=comp.compatibility_score,
                match_level=comp.match_level,
                reasons=comp.reasons,
                warnings=comp.warnings,
                ai_explanation=explanation,
            )
        )
    db.commit()

    out: list[MatchDogResult] = []
    for dog, comp in top_slice:
        mr = (
            db.query(MatchResult)
            .filter(
                MatchResult.adopter_profile_id == adopter.id,
                MatchResult.dog_id == dog.id,
            )
            .one()
        )
        out.append(_comp_to_result(comp, ai_explanation=mr.ai_explanation))

    filter_parts: list[str] = []
    if criteria.is_restrictive():
        filter_parts.append(criteria.summary_es())
    sort_hint = criteria.province_sort_hint_es()
    if sort_hint:
        filter_parts.append(sort_hint)
    filters_note = "; ".join(filter_parts) if filter_parts else None
    return MatchRunResponse(
        adopter_profile_id=adopter.id,
        results=out,
        candidates_count=len(dogs),
        filters_applied=filters_note,
    )


@router.get("/{adopter_profile_id}", response_model=list[MatchStoredRead])
def get_matches(
    adopter_profile_id: int,
    db: Session = Depends(get_db),
    refresh: bool = Query(False),
) -> list[MatchResult]:
    if refresh:
        raise HTTPException(status_code=400, detail="Usa POST /matches para recalcular")
    rows = (
        db.query(MatchResult)
        .filter(MatchResult.adopter_profile_id == adopter_profile_id)
        .all()
    )
    if not rows:
        return rows
    adopter = db.get(AdopterProfile, adopter_profile_id)
    pref = (adopter.province_preference or "").strip() if adopter else None
    dog_ids = [r.dog_id for r in rows]
    dogs = {d.id: d for d in db.query(Dog).filter(Dog.id.in_(dog_ids)).all()}
    rows.sort(
        key=lambda mr: (
            -mr.compatibility_score,
            province_proximity_rank(dogs[mr.dog_id], pref) if mr.dog_id in dogs else 1,
            mr.dog_id,
        )
    )
    return rows
