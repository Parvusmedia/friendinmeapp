from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


class ImportRowPreview(BaseModel):
    row_number: int
    name: str
    fotos_zip: str
    photo_count: int = 0
    ok: bool
    errors: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
    data: dict[str, Any] | None = None


class ImportPreviewResponse(BaseModel):
    job_id: str
    total_rows: int
    valid_rows: int
    invalid_rows: int
    rows: list[ImportRowPreview]


class ImportJobStatus(BaseModel):
    job_id: str
    status: Literal["preview", "processing", "completed", "failed"]
    total_rows: int = 0
    processed_rows: int = 0
    created_count: int = 0
    error_count: int = 0
    message: str | None = None
    rows: list[ImportRowPreview] = Field(default_factory=list)
    created_at: datetime | None = None
    completed_at: datetime | None = None


class ImportConfirmResponse(BaseModel):
    job_id: str
    status: Literal["processing"]
    message: str
