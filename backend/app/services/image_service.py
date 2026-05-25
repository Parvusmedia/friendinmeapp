import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status

from app.config import get_settings

_EXT_BY_MIME = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}
_EXT_BY_SUFFIX = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
}


class ImageService:
    def __init__(self) -> None:
        self.settings = get_settings()
        Path(self.settings.upload_dir).mkdir(parents=True, exist_ok=True)

    def _validate_mime(self, ctype: str) -> None:
        if ctype not in self.settings.allowed_mime_list:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Tipo de archivo no permitido: {ctype}",
            )

    def _validate(self, file: UploadFile) -> None:
        max_bytes = self.settings.max_upload_mb * 1024 * 1024
        self._validate_mime(file.content_type or "")

    async def save_upload(self, file: UploadFile) -> str:
        self._validate(file)
        max_bytes = self.settings.max_upload_mb * 1024 * 1024
        ext = _EXT_BY_MIME.get(file.content_type or "", ".bin")
        return await self._write_stream(file, ext, max_bytes)

    async def _write_stream(self, file: UploadFile, ext: str, max_bytes: int) -> str:
        name = f"{uuid.uuid4().hex}{ext}"
        dest = Path(self.settings.upload_dir) / name
        size = 0
        chunk = 1024 * 1024
        with dest.open("wb") as out:
            while True:
                data = await file.read(chunk)
                if not data:
                    break
                size += len(data)
                if size > max_bytes:
                    out.close()
                    dest.unlink(missing_ok=True)
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail="Archivo demasiado grande",
                    )
                out.write(data)
        await file.seek(0)
        return f"/media/{name}"

    def save_bytes(self, data: bytes, *, filename: str) -> str:
        max_bytes = self.settings.max_upload_mb * 1024 * 1024
        if len(data) > max_bytes:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="Archivo demasiado grande",
            )
        suffix = Path(filename).suffix.lower()
        ctype = _EXT_BY_SUFFIX.get(suffix)
        if not ctype:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Extensión no permitida: {suffix}",
            )
        self._validate_mime(ctype)
        ext = _EXT_BY_MIME[ctype]
        name = f"{uuid.uuid4().hex}{ext}"
        dest = Path(self.settings.upload_dir) / name
        dest.write_bytes(data)
        return f"/media/{name}"

    def delete_media_file(self, public_path: str) -> None:
        """Elimina archivo en disco si la ruta es /media/{filename} segura."""
        if not public_path.startswith("/media/"):
            raise HTTPException(status_code=400, detail="Ruta de imagen no válida")
        name = Path(public_path).name
        if name != public_path.split("/")[-1] or ".." in name:
            raise HTTPException(status_code=400, detail="Ruta de imagen no válida")
        target = Path(self.settings.upload_dir) / name
        if target.is_file():
            target.unlink()
