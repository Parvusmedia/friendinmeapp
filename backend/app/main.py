import logging
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException

from sqlalchemy.exc import OperationalError

from app.config import get_settings
from app.routes import (
    admin,
    adopters,
    auth,
    dog_import,
    dogs,
    leads,
    matches,
    partner_campaigns,
    shelter_applications,
    shelters,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("friendinme")

settings = get_settings()
Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)
Path(settings.import_staging_dir).mkdir(parents=True, exist_ok=True)

app = FastAPI(title="FriendInMe API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    if isinstance(exc, StarletteHTTPException):
        return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})
    if isinstance(exc, RequestValidationError):
        return JSONResponse(status_code=422, content={"detail": exc.errors()})
    if isinstance(exc, OperationalError):
        logger.exception("Database error: %s", exc)
        return JSONResponse(status_code=503, content={"detail": "Base de datos no disponible"})
    logger.exception("Unhandled error: %s", exc)
    if settings.environment == "production":
        return JSONResponse(status_code=500, content={"detail": "Error interno del servidor"})
    return JSONResponse(status_code=500, content={"detail": str(exc)})


def _health_payload() -> dict[str, str]:
    return {"status": "ok", "app": "friendinme-api"}


@app.get("/health")
def health_root() -> dict[str, str]:
    """Sin prefijo /api: útil para comprobar con `curl 127.0.0.1:8000/health` qué proceso escucha."""
    return _health_payload()


@app.get("/api/health")
def health_api() -> dict[str, str]:
    return _health_payload()


app.mount("/media", StaticFiles(directory=settings.upload_dir), name="media")

for router in (
    auth,
    shelters,
    shelter_applications,
    dog_import,
    dogs,
    adopters,
    matches,
    leads,
    admin,
    partner_campaigns,
):
    app.include_router(router.router, prefix="/api")
