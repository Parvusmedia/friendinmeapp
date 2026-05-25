from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.dog import Dog
from app.models.enums import UserRole
from app.models.shelter import Shelter
from app.models.user import User
from app.schemas.shelter import (
    ShelterCreate,
    ShelterDogBrief,
    ShelterManageRead,
    ShelterRead,
    ShelterUpdate,
    ShelterUserBrief,
)
from app.utils.dependencies import require_admin, require_shelter_or_admin

router = APIRouter(prefix="/shelters", tags=["shelters"])


@router.get("", response_model=list[ShelterRead])
def list_shelters(db: Session = Depends(get_db)) -> list[Shelter]:
    return db.query(Shelter).order_by(Shelter.name).all()


@router.post("", response_model=ShelterRead, status_code=status.HTTP_201_CREATED)
def create_shelter(
    payload: ShelterCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> Shelter:
    s = Shelter(**payload.model_dump())
    db.add(s)
    db.commit()
    db.refresh(s)
    return s


@router.get("/{shelter_id}", response_model=ShelterRead)
def get_shelter(shelter_id: int, db: Session = Depends(get_db)) -> Shelter:
    s = db.get(Shelter, shelter_id)
    if not s:
        raise HTTPException(status_code=404, detail="Refugio no encontrado")
    return s


@router.get("/{shelter_id}/manage", response_model=ShelterManageRead)
def get_shelter_manage(
    shelter_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> ShelterManageRead:
    s = db.get(Shelter, shelter_id)
    if not s:
        raise HTTPException(status_code=404, detail="Refugio no encontrado")
    dogs = db.query(Dog).filter(Dog.shelter_id == shelter_id).order_by(Dog.name).all()
    users = db.query(User).filter(User.shelter_id == shelter_id).order_by(User.email).all()
    return ShelterManageRead(
        shelter=ShelterRead.model_validate(s),
        dog_count=len(dogs),
        user_count=len(users),
        users=[ShelterUserBrief.model_validate(u) for u in users],
        dogs=[
            ShelterDogBrief(
                id=d.id,
                name=d.name,
                status=d.status.value if hasattr(d.status, "value") else str(d.status),
                city=d.city,
                province=d.province,
                breed=d.breed,
            )
            for d in dogs
        ],
    )


@router.put("/{shelter_id}", response_model=ShelterRead)
def update_shelter(
    shelter_id: int,
    payload: ShelterUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_shelter_or_admin),
) -> Shelter:
    s = db.get(Shelter, shelter_id)
    if not s:
        raise HTTPException(status_code=404, detail="Refugio no encontrado")
    if user.role == UserRole.shelter and user.shelter_id != shelter_id:
        raise HTTPException(status_code=403, detail="No autorizado")
    data = payload.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(s, k, v)
    db.commit()
    db.refresh(s)
    return s


@router.delete("/{shelter_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_shelter(
    shelter_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> None:
    s = db.get(Shelter, shelter_id)
    if not s:
        raise HTTPException(status_code=404, detail="Refugio no encontrado")
    dog_count = db.query(func.count(Dog.id)).filter(Dog.shelter_id == shelter_id).scalar() or 0
    if dog_count:
        raise HTTPException(
            status_code=409,
            detail=f"No se puede eliminar: el refugio tiene {dog_count} perro(s) registrado(s). Elimínalos o reasígnalos antes.",
        )
    user_count = db.query(func.count(User.id)).filter(User.shelter_id == shelter_id).scalar() or 0
    if user_count:
        raise HTTPException(
            status_code=409,
            detail=f"No se puede eliminar: hay {user_count} usuario(s) vinculado(s) a este refugio.",
        )
    db.delete(s)
    db.commit()
