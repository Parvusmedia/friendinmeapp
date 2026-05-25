from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    environment: str = "development"
    debug: bool = True
    secret_key: str = "dev-secret-change"
    jwt_secret: str = "dev-jwt-secret-change-me-please-32chars"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24 * 7

    database_url: str = "postgresql://friendinme:friendinme@localhost:5432/friendinme"

    cors_origins: str = "http://localhost:3000"

    public_base_url: str = "http://localhost:3000"

    upload_dir: str = "./uploads"
    max_upload_mb: int = 5
    allowed_image_types: str = "image/jpeg,image/png,image/webp"

    import_staging_dir: str = "./import_staging"
    max_import_zip_mb: int = 200
    max_photos_per_dog: int = 30
    import_job_ttl_hours: int = 24

    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"

    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_tls: bool = True
    mail_from: str = "noreply@friendinme.com"
    admin_notify_email: str = ""

    rate_limit_enabled: bool = True
    rate_limit_login_per_minute: int = 10
    rate_limit_adopter_lookup_per_minute: int = 20
    rate_limit_matches_per_minute: int = 8
    rate_limit_leads_per_minute: int = 15
    rate_limit_magic_link_per_hour: int = 5

    adopter_magic_link_expire_minutes: int = 60 * 24 * 14

    @property
    def cors_origin_list(self) -> List[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def allowed_mime_list(self) -> List[str]:
        return [m.strip() for m in self.allowed_image_types.split(",") if m.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
