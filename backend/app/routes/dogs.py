from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.constants.breeds import BREED_OPTIONS, breeds_for_filters, normalize_breed
from app.database import get_db
from app.models.dog import Dog
from app.models.enums import DogSize, DogStatus, EnergyLevel, UserRole
from app.models.lead import AdoptionLead
from app.models.match_result import MatchResult
from app.models.user import User
from app.schemas.dog import DogCreate, DogImagePath, DogPublicDetail, DogRead, DogStatusPatch, DogUpdate
from app.schemas.dog_filters import DogFiltersMeta
from app.services.ai_service import AIService
from app.services.image_service import ImageService
from app.utils.dependencies import get_optional_user, require_shelter_or_admin
from app.utils.dog_photos import count_valid_photos

router = APIRouter(prefix="/dogs", tags=["dogs"])


def _ensure_dog_access(dog: Dog, user: User) -> None:
    if user.role == UserRole.shelter and dog.shelter_id != user.shelter_id:
        raise HTTPException(status_code=403, detail="No autorizado")


def _parse_status(value: str | None) -> DogStatus | None:
    if not value:
        return None
    try:
        return DogStatus(value)
    except ValueError:
        return None


@router.get("/filters", response_model=DogFiltersMeta)
def dog_filters_meta(db: Session = Depends(get_db)) -> DogFiltersMeta:
    """Provincias y razas con al menos un perro disponible (público)."""
    base = db.query(Dog).filter(Dog.status == DogStatus.available)
    provinces = [
        r[0]
        for r in base.with_entities(Dog.province)
        .distinct()
        .order_by(Dog.province.asc())
        .all()
        if r[0]
    ]
    breeds_db = [r[0] for r in base.with_entities(Dog.breed).filter(Dog.breed != "").distinct().all() if r[0]]
    breeds = breeds_for_filters(breeds_db)
    return DogFiltersMeta(provinces=provinces, breeds=breeds)


@router.get("/breed-options")
def dog_breed_options() -> dict[str, list[str]]:
    """Razas canónicas para formularios e importación."""
    return {"breeds": BREED_OPTIONS}


@router.get("", response_model=list[DogRead])
def list_dogs(
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
    province: str | None = None,
    breed: str | None = None,
    size: str | None = None,
    energy_level: str | None = None,
    status_filter: str | None = Query(None, alias="status"),
    shelter_id: int | None = None,
) -> list[Dog]:
    q = db.query(Dog)
    st = _parse_status(status_filter)

    if user is None:
        q = q.filter(Dog.status == DogStatus.available)
    elif user.role == UserRole.admin:
        if st:
            q = q.filter(Dog.status == st)
        if shelter_id is not None:
            q = q.filter(Dog.shelter_id == shelter_id)
    elif user.role == UserRole.shelter:
        q = q.filter(Dog.shelter_id == user.shelter_id)
        if st:
            q = q.filter(Dog.status == st)

    if province:
        q = q.filter(func.lower(Dog.province) == province.strip().lower())
    if breed:
        q = q.filter(func.lower(Dog.breed) == breed.strip().lower())
    if size:
        try:
            q = q.filter(Dog.size == DogSize(size))
        except ValueError:
            pass
    if energy_level:
        try:
            q = q.filter(Dog.energy_level == EnergyLevel(energy_level))
        except ValueError:
            pass

    rows = q.order_by(Dog.created_at.desc()).all()
    return [
        DogRead.model_validate(d).model_copy(update={"photo_count": count_valid_photos(d)})
        for d in rows
    ]


@router.post("", response_model=DogRead, status_code=status.HTTP_201_CREATED)
def create_dog(
    payload: DogCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_shelter_or_admin),
) -> Dog:
    shelter_id = payload.shelter_id
    if user.role == UserRole.shelter:
        shelter_id = user.shelter_id
    if shelter_id is None:
        raise HTTPException(status_code=400, detail="shelter_id requerido")
    data = payload.model_dump(exclude={"shelter_id"})
    data["breed"] = normalize_breed(data.get("breed"))[0]
    dog = Dog(shelter_id=shelter_id, **data)
    db.add(dog)
    db.commit()
    db.refresh(dog)
    return dog


@router.get("/{dog_id}", response_model=DogPublicDetail)
def get_dog(
    dog_id: int,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
) -> DogPublicDetail:
    dog = db.get(Dog, dog_id)
    if not dog:
        raise HTTPException(status_code=404, detail="Perro no encontrado")
    if dog.status == DogStatus.hidden:
        allowed = user and (
            user.role == UserRole.admin
            or (user.role == UserRole.shelter and user.shelter_id == dog.shelter_id)
        )
        if not allowed:
            raise HTTPException(status_code=404, detail="Perro no encontrado")
    if user is None and dog.status != DogStatus.available:
        raise HTTPException(status_code=404, detail="Perro no encontrado")
    if user and user.role == UserRole.shelter and dog.shelter_id != user.shelter_id:
        if dog.status != DogStatus.available:
            raise HTTPException(status_code=404, detail="Perro no encontrado")
    shelter = dog.shelter
    base = DogRead.model_validate(dog)
    return DogPublicDetail(
        **base.model_dump(),
        shelter_name=shelter.name if shelter else "",
        shelter_whatsapp=shelter.whatsapp if shelter else "",
        shelter_contact_name=shelter.contact_person if shelter else "",
        shelter_contact_mobile=shelter.contact_mobile if shelter else "",
    )


@router.put("/{dog_id}", response_model=DogRead)
def update_dog(
    dog_id: int,
    payload: DogUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_shelter_or_admin),
) -> Dog:
    dog = db.get(Dog, dog_id)
    if not dog:
        raise HTTPException(status_code=404, detail="Perro no encontrado")
    _ensure_dog_access(dog, user)
    updates = payload.model_dump(exclude_unset=True)
    if "breed" in updates and updates["breed"] is not None:
        updates["breed"] = normalize_breed(updates["breed"])[0]
    for k, v in updates.items():
        setattr(dog, k, v)
    db.commit()
    db.refresh(dog)
    return dog


@router.delete("/{dog_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_dog(
    dog_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_shelter_or_admin),
) -> None:
    dog = db.get(Dog, dog_id)
    if not dog:
        raise HTTPException(status_code=404, detail="Perro no encontrado")
    _ensure_dog_access(dog, user)
    img_svc = ImageService()
    for path in _dog_gallery_paths(dog):
        img_svc.delete_media_file(path)
    db.query(MatchResult).filter(MatchResult.dog_id == dog_id).delete(synchronize_session=False)
    db.query(AdoptionLead).filter(AdoptionLead.dog_id == dog_id).delete(synchronize_session=False)
    db.delete(dog)
    db.commit()


@router.patch("/{dog_id}/status", response_model=DogRead)
def patch_dog_status(
    dog_id: int,
    payload: DogStatusPatch,
    db: Session = Depends(get_db),
    user: User = Depends(require_shelter_or_admin),
) -> Dog:
    dog = db.get(Dog, dog_id)
    if not dog:
        raise HTTPException(status_code=404, detail="Perro no encontrado")
    _ensure_dog_access(dog, user)
    dog.status = payload.status
    db.commit()
    db.refresh(dog)
    return dog


@router.post("/{dog_id}/images", response_model=DogRead)
async def upload_dog_image(
    dog_id: int,
    file: UploadFile = File(...),
    set_main: bool = Query(False),
    db: Session = Depends(get_db),
    user: User = Depends(require_shelter_or_admin),
) -> Dog:
    dog = db.get(Dog, dog_id)
    if not dog:
        raise HTTPException(status_code=404, detail="Perro no encontrado")
    _ensure_dog_access(dog, user)
    svc = ImageService()
    path = await svc.save_upload(file)
    images = list(dog.images or [])
    if path not in images:
        images.append(path)
    dog.images = images
    if set_main or not dog.main_image_url:
        dog.main_image_url = path
    db.commit()
    db.refresh(dog)
    return dog


@router.post("/{dog_id}/main-image", response_model=DogRead)
def set_main_dog_image(
    dog_id: int,
    payload: DogImagePath,
    db: Session = Depends(get_db),
    user: User = Depends(require_shelter_or_admin),
) -> Dog:
    dog = db.get(Dog, dog_id)
    if not dog:
        raise HTTPException(status_code=404, detail="Perro no encontrado")
    _ensure_dog_access(dog, user)
    path = payload.path.strip()
    gallery = _dog_gallery_paths(dog)
    if path not in gallery:
        raise HTTPException(status_code=400, detail="La imagen no pertenece a este perro")
    dog.main_image_url = path
    db.commit()
    db.refresh(dog)
    return dog


@router.delete("/{dog_id}/images", response_model=DogRead)
def delete_dog_image(
    dog_id: int,
    payload: DogImagePath,
    db: Session = Depends(get_db),
    user: User = Depends(require_shelter_or_admin),
) -> Dog:
    dog = db.get(Dog, dog_id)
    if not dog:
        raise HTTPException(status_code=404, detail="Perro no encontrado")
    _ensure_dog_access(dog, user)
    path = payload.path.strip()
    gallery = _dog_gallery_paths(dog)
    if path not in gallery:
        raise HTTPException(status_code=400, detail="La imagen no pertenece a este perro")

    images = [p for p in list(dog.images or []) if p != path]
    dog.images = images
    if dog.main_image_url == path:
        dog.main_image_url = images[0] if images else None

    ImageService().delete_media_file(path)
    db.commit()
    db.refresh(dog)
    return dog


def _dog_gallery_paths(dog: Dog) -> set[str]:
    paths: set[str] = set()
    if dog.main_image_url:
        paths.add(dog.main_image_url)
    for p in dog.images or []:
        if isinstance(p, str) and p:
            paths.add(p)
    return paths


@router.post("/{dog_id}/generate-summary", response_model=DogRead)
async def generate_summary(
    dog_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_shelter_or_admin),
) -> Dog:
    dog = db.get(Dog, dog_id)
    if not dog:
        raise HTTPException(status_code=404, detail="Perro no encontrado")
    _ensure_dog_access(dog, user)
    ai = AIService()
    dog.ai_generated_summary = await ai.generate_dog_summary(dog)
    db.commit()
    db.refresh(dog)
    return dog
