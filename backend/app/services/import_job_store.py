from __future__ import annotations

import shutil
import threading
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Literal

from app.config import get_settings
from app.schemas.dog_import import ImportRowPreview


@dataclass
class ImportJob:
    job_id: str
    user_id: int
    shelter_id: int
    staging_dir: Path
    status: Literal["preview", "processing", "completed", "failed"] = "preview"
    total_rows: int = 0
    processed_rows: int = 0
    created_count: int = 0
    error_count: int = 0
    message: str | None = None
    rows: list[ImportRowPreview] = field(default_factory=list)
    row_payloads: list[dict[str, Any]] = field(default_factory=list)
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: datetime | None = None


class ImportJobStore:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._jobs: dict[str, ImportJob] = {}
        settings = get_settings()
        self._base = Path(settings.import_staging_dir)
        self._base.mkdir(parents=True, exist_ok=True)

    def create_job(self, *, user_id: int, shelter_id: int) -> ImportJob:
        job_id = uuid.uuid4().hex
        staging = self._base / job_id
        staging.mkdir(parents=True, exist_ok=True)
        job = ImportJob(job_id=job_id, user_id=user_id, shelter_id=shelter_id, staging_dir=staging)
        with self._lock:
            self._jobs[job_id] = job
        return job

    def get(self, job_id: str) -> ImportJob | None:
        with self._lock:
            return self._jobs.get(job_id)

    def update(self, job: ImportJob) -> None:
        with self._lock:
            self._jobs[job.job_id] = job

    def delete_staging(self, job: ImportJob) -> None:
        if job.staging_dir.exists():
            shutil.rmtree(job.staging_dir, ignore_errors=True)


import_job_store = ImportJobStore()
