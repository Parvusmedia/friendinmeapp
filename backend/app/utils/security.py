from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import get_settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
settings = get_settings()


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: dict[str, Any], expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.jwt_expire_minutes)
    )
    to_encode["exp"] = expire
    return jwt.encode(to_encode, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> dict[str, Any] | None:
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except JWTError:
        return None


def create_adopter_results_token(adopter_id: int) -> str:
    return create_access_token(
        {"sub": "adopter_results", "adopter_id": adopter_id},
        expires_delta=timedelta(minutes=settings.adopter_magic_link_expire_minutes),
    )


def decode_adopter_results_token(token: str) -> int | None:
    payload = decode_token(token)
    if not payload or payload.get("sub") != "adopter_results":
        return None
    adopter_id = payload.get("adopter_id")
    if isinstance(adopter_id, int):
        return adopter_id
    return None
