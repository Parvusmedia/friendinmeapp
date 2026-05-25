from datetime import datetime, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.user import User
from app.schemas.dog_import import ImportConfirmResponse, ImportJobStatus, ImportPreviewResponse
from app.services.dog_import_service import DogImportService
from app.services.import_job_store import import_job_store
from app.utils.dependencies import require_shelter_or_admin

router = APIRouter(prefix="/dogs/import", tags=["dog-import"])


def _job_to_status(job) -> ImportJobStatus:
    return ImportJobStatus(
        job_id=job.job_id,
        status=job.status,
        total_rows=job.total_rows,
        processed_rows=job.processed_rows,
        created_count=job.created_count,
        error_count=job.error_count,
        message=job.message,
        rows=job.rows,
        created_at=job.created_at,
        completed_at=job.completed_at,
    )


def _get_job_for_user(job_id: str, user: User):
    job = import_job_store.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Importación no encontrada")
    if job.user_id != user.id:
        raise HTTPException(status_code=403, detail="No autorizado")
    return job


def _run_import_background(job_id: str) -> None:
    job = import_job_store.get(job_id)
    if not job:
        return
    db = SessionLocal()
    try:
        DogImportService().run_import(db, job)
    except Exception as exc:  # noqa: BLE001
        job.status = "failed"
        job.message = str(exc)
        job.completed_at = datetime.now(timezone.utc)
        import_job_store.update(job)
        import_job_store.delete_staging(job)
    finally:
        db.close()


@router.get("/template")
def download_import_template(
    user: User = Depends(require_shelter_or_admin),
) -> Response:
    data = DogImportService().build_template_zip()
    return Response(
        content=data,
        media_type="application/zip",
        headers={"Content-Disposition": 'attachment; filename="friendinme-import-plantilla.zip"'},
    )


@router.post("/preview", response_model=ImportPreviewResponse)
async def preview_dog_import(
    file: UploadFile = File(...),
    shelter_id: int | None = Query(None),
    user: User = Depends(require_shelter_or_admin),
) -> ImportPreviewResponse:
    if not file.filename or not file.filename.lower().endswith(".zip"):
        raise HTTPException(status_code=400, detail="Sube un archivo .zip")

    svc = DogImportService()
    sid = svc.resolve_shelter_id(user, shelter_id)
    job = import_job_store.create_job(user_id=user.id, shelter_id=sid)

    try:
        package = await svc.save_upload_to_staging(file, job.staging_dir)
        csv_path, fotos_dir = svc.extract_package(package, job.staging_dir)
        previews, payloads = svc.build_preview(csv_path, fotos_dir)

        job.rows = previews
        job.row_payloads = payloads
        job.total_rows = len(previews)
        job.status = "preview"
        import_job_store.update(job)

        valid = sum(1 for r in previews if r.ok)
        return ImportPreviewResponse(
            job_id=job.job_id,
            total_rows=len(previews),
            valid_rows=valid,
            invalid_rows=len(previews) - valid,
            rows=previews,
        )
    except HTTPException:
        import_job_store.delete_staging(job)
        raise
    except Exception as exc:  # noqa: BLE001
        import_job_store.delete_staging(job)
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/{job_id}/confirm", response_model=ImportConfirmResponse)
def confirm_dog_import(
    job_id: str,
    background_tasks: BackgroundTasks,
    user: User = Depends(require_shelter_or_admin),
) -> ImportConfirmResponse:
    job = _get_job_for_user(job_id, user)
    if job.status != "preview":
        raise HTTPException(status_code=400, detail="Esta importación ya fue procesada o está en curso")
    if not job.row_payloads:
        raise HTTPException(status_code=400, detail="No hay filas válidas para importar")

    job.status = "processing"
    job.processed_rows = 0
    job.created_count = 0
    job.error_count = 0
    import_job_store.update(job)
    background_tasks.add_task(_run_import_background, job_id)

    return ImportConfirmResponse(
        job_id=job_id,
        status="processing",
        message="Importación en curso. Consulta el estado en unos segundos.",
    )


@router.get("/{job_id}", response_model=ImportJobStatus)
def get_import_status(
    job_id: str,
    user: User = Depends(require_shelter_or_admin),
) -> ImportJobStatus:
    job = _get_job_for_user(job_id, user)
    return _job_to_status(job)
