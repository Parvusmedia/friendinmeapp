from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.models.enums import UserRole
from app.models.shelter import Shelter
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterShelterUserRequest, TokenResponse
from app.utils.dependencies import require_admin
from app.utils.rate_limit import check_rate_limit
from app.utils.security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)) -> TokenResponse:
    settings = get_settings()
    check_rate_limit(
        request,
        key="login",
        limit=settings.rate_limit_login_per_minute,
        window_seconds=60,
    )
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales incorrectas")
    token = create_access_token(
        {"sub": str(user.id), "role": user.role.value, "shelter_id": user.shelter_id}
    )
    return TokenResponse(access_token=token)


@router.post("/register-shelter-user", response_model=TokenResponse)
def register_shelter_user(
    payload: RegisterShelterUserRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> TokenResponse:
    shelter = db.get(Shelter, payload.shelter_id)
    if not shelter:
        raise HTTPException(status_code=404, detail="Refugio no encontrado")
    exists = db.query(User).filter(User.email == payload.email.lower()).first()
    if exists:
        raise HTTPException(status_code=400, detail="Email ya registrado")
    user = User(
        email=payload.email.lower(),
        password_hash=hash_password(payload.password),
        role=UserRole.shelter,
        shelter_id=payload.shelter_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token(
        {"sub": str(user.id), "role": user.role.value, "shelter_id": user.shelter_id}
    )
    return TokenResponse(access_token=token)
