from __future__ import annotations

import csv
import io
import re
import shutil
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.config import get_settings
from app.constants.breeds import BREED_OPTIONS, normalize_breed
from app.models.dog import Dog
from app.models.enums import DogSex, DogSize, DogStatus, EnergyLevel, Sociability, TriState
from app.models.user import User
from app.schemas.dog_import import ImportRowPreview
from app.services.image_service import ImageService
from app.services.import_job_store import ImportJob, import_job_store

IMAGE_SUFFIXES = {".jpg", ".jpeg", ".png", ".webp"}
MAIN_NAMES = {"portada", "main", "cover", "principal"}
CSV_NAMES = {"perros.csv", "perros.CSV", "dogs.csv"}

HEADER_ALIASES: dict[str, str] = {
    "nombre": "name",
    "name": "name",
    "raza": "breed",
    "breed": "breed",
    "edad": "age_estimate",
    "edad_aproximada": "age_estimate",
    "age_estimate": "age_estimate",
    "tamaño": "size",
    "tamano": "size",
    "size": "size",
    "sexo": "sex",
    "sex": "sex",
    "provincia": "province",
    "province": "province",
    "ciudad": "city",
    "city": "city",
    "energia": "energy_level",
    "energía": "energy_level",
    "energy_level": "energy_level",
    "sociabilidad_perros": "sociability_with_dogs",
    "sociabilidad_con_perros": "sociability_with_dogs",
    "sociability_with_dogs": "sociability_with_dogs",
    "sociabilidad_gatos": "sociability_with_cats",
    "sociabilidad_con_gatos": "sociability_with_cats",
    "sociability_with_cats": "sociability_with_cats",
    "bueno_ninos": "good_with_children",
    "bueno_con_ninos": "good_with_children",
    "good_with_children": "good_with_children",
    "piso": "can_live_in_apartment",
    "puede_piso": "can_live_in_apartment",
    "can_live_in_apartment": "can_live_in_apartment",
    "experiencia": "needs_experience",
    "necesita_experiencia": "needs_experience",
    "needs_experience": "needs_experience",
    "solo_horas": "can_be_alone_hours",
    "tolerancia_solo": "can_be_alone_hours",
    "can_be_alone_hours": "can_be_alone_hours",
    "medicas": "medical_needs",
    "necesidades_medicas": "medical_needs",
    "medical_needs": "medical_needs",
    "comportamiento": "behaviour_notes",
    "notas_comportamiento": "behaviour_notes",
    "behaviour_notes": "behaviour_notes",
    "historia": "story",
    "story": "story",
    "hogar_ideal": "ideal_home",
    "ideal_home": "ideal_home",
    "estado": "status",
    "status": "status",
    "fotos_zip": "fotos_zip",
    "fotos": "fotos_zip",
    "zip_fotos": "fotos_zip",
}

SIZE_MAP = {
    "small": DogSize.small,
    "pequeño": DogSize.small,
    "pequeno": DogSize.small,
    "s": DogSize.small,
    "medium": DogSize.medium,
    "mediano": DogSize.medium,
    "m": DogSize.medium,
    "large": DogSize.large,
    "grande": DogSize.large,
    "l": DogSize.large,
}

SEX_MAP = {
    "male": DogSex.male,
    "macho": DogSex.male,
    "m": DogSex.male,
    "female": DogSex.female,
    "hembra": DogSex.female,
    "f": DogSex.female,
    "unknown": DogSex.unknown,
    "desconocido": DogSex.unknown,
}

ENERGY_MAP = {
    "low": EnergyLevel.low,
    "baja": EnergyLevel.low,
    "bajo": EnergyLevel.low,
    "medium": EnergyLevel.medium,
    "media": EnergyLevel.medium,
    "medio": EnergyLevel.medium,
    "high": EnergyLevel.high,
    "alta": EnergyLevel.high,
    "alto": EnergyLevel.high,
}

SOCIABILITY_MAP = {
    "low": Sociability.low,
    "baja": Sociability.low,
    "bajo": Sociability.low,
    "medium": Sociability.medium,
    "media": Sociability.medium,
    "medio": Sociability.medium,
    "high": Sociability.high,
    "alta": Sociability.high,
    "alto": Sociability.high,
    "unknown": Sociability.unknown,
    "desconocido": Sociability.unknown,
}

TRISTATE_MAP = {
    "yes": TriState.yes,
    "si": TriState.yes,
    "sí": TriState.yes,
    "true": TriState.yes,
    "1": TriState.yes,
    "no": TriState.no,
    "false": TriState.no,
    "0": TriState.no,
    "unknown": TriState.unknown,
    "desconocido": TriState.unknown,
}

STATUS_MAP = {
    "available": DogStatus.available,
    "disponible": DogStatus.available,
    "reserved": DogStatus.reserved,
    "reservado": DogStatus.reserved,
    "adopted": DogStatus.adopted,
    "adoptado": DogStatus.adopted,
    "hidden": DogStatus.hidden,
    "oculto": DogStatus.hidden,
}


def _norm_key(key: str) -> str:
    k = key.strip().lower()
    k = re.sub(r"\s+", "_", k)
    return HEADER_ALIASES.get(k, k)


def _norm_val(value: str) -> str:
    return value.strip().lower()


def _parse_enum(value: str, mapping: dict[str, Any], field: str, errors: list[str]) -> Any | None:
    if not value.strip():
        errors.append(f"{field} vacío")
        return None
    key = _norm_val(value)
    if key not in mapping:
        errors.append(f"{field} no válido: {value}")
        return None
    return mapping[key]


def _safe_zip_member(name: str) -> bool:
    p = Path(name)
    if name.startswith("/") or ".." in p.parts:
        return False
    return True


def _count_images_in_zip(path: Path) -> int:
    if not path.is_file():
        return 0
    count = 0
    with zipfile.ZipFile(path, "r") as zf:
        for info in zf.infolist():
            if info.is_dir():
                continue
            if not _safe_zip_member(info.filename):
                continue
            if Path(info.filename).suffix.lower() in IMAGE_SUFFIXES:
                count += 1
    return count


class DogImportService:
    def __init__(self) -> None:
        self.settings = get_settings()

    async def save_upload_to_staging(self, upload: UploadFile, staging: Path) -> Path:
        max_bytes = self.settings.max_import_zip_mb * 1024 * 1024
        dest = staging / "package.zip"
        size = 0
        with dest.open("wb") as out:
            while True:
                chunk = await upload.read(1024 * 1024)
                if not chunk:
                    break
                size += len(chunk)
                if size > max_bytes:
                    dest.unlink(missing_ok=True)
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail=f"ZIP demasiado grande (máx. {self.settings.max_import_zip_mb} MB)",
                    )
                out.write(chunk)
        return dest

    def extract_package(self, package_zip: Path, staging: Path) -> tuple[Path, Path]:
        extract_root = staging / "extracted"
        if extract_root.exists():
            shutil.rmtree(extract_root)
        extract_root.mkdir(parents=True)

        with zipfile.ZipFile(package_zip, "r") as zf:
            total = sum(i.file_size for i in zf.infolist())
            if total > self.settings.max_import_zip_mb * 1024 * 1024 * 2:
                raise HTTPException(status_code=400, detail="Contenido descomprimido demasiado grande")
            for info in zf.infolist():
                if not _safe_zip_member(info.filename):
                    raise HTTPException(status_code=400, detail=f"Ruta no permitida en ZIP: {info.filename}")
            zf.extractall(extract_root)

        csv_path = None
        fotos_dir = None
        for p in extract_root.rglob("*"):
            if p.is_file() and p.name in CSV_NAMES:
                csv_path = p
            if p.is_dir() and p.name.lower() == "fotos":
                fotos_dir = p

        if csv_path is None:
            raise HTTPException(
                status_code=400,
                detail="Falta perros.csv en el ZIP (raíz o subcarpeta)",
            )
        if fotos_dir is None:
            raise HTTPException(
                status_code=400,
                detail="Falta la carpeta fotos/ con un ZIP por perro",
            )
        return csv_path, fotos_dir

    def parse_csv_rows(self, csv_path: Path) -> list[dict[str, str]]:
        raw = csv_path.read_bytes()
        text = raw.decode("utf-8-sig")
        try:
            dialect = csv.Sniffer().sniff(text[:4096], delimiters=";,\t")
        except csv.Error:
            dialect = csv.excel
        reader = csv.DictReader(io.StringIO(text), dialect=dialect)
        if not reader.fieldnames:
            raise HTTPException(status_code=400, detail="CSV sin cabeceras")
        rows: list[dict[str, str]] = []
        for row in reader:
            mapped: dict[str, str] = {}
            for k, v in row.items():
                if k is None:
                    continue
                field = _norm_key(k)
                mapped[field] = (v or "").strip()
            if any(mapped.values()):
                rows.append(mapped)
        return rows

    def validate_row(
        self, row: dict[str, str], row_number: int, fotos_dir: Path
    ) -> ImportRowPreview:
        errors: list[str] = []
        warnings: list[str] = []
        name = row.get("name", "").strip()
        fotos_zip = row.get("fotos_zip", "").strip()
        if not name:
            errors.append("nombre vacío")
        if not fotos_zip:
            errors.append("fotos_zip vacío")
        elif not fotos_zip.lower().endswith(".zip"):
            fotos_zip = f"{fotos_zip}.zip"

        zip_path = fotos_dir / fotos_zip if fotos_zip else None
        photo_count = 0
        if fotos_zip and zip_path and not zip_path.is_file():
            errors.append(f"no existe fotos/{fotos_zip}")
        elif zip_path and zip_path.is_file():
            photo_count = _count_images_in_zip(zip_path)
            if photo_count == 0:
                errors.append(f"{fotos_zip} no contiene imágenes válidas")
            elif photo_count > self.settings.max_photos_per_dog:
                errors.append(
                    f"demasiadas fotos en {fotos_zip} (máx. {self.settings.max_photos_per_dog})"
                )

        payload: dict[str, Any] = {}
        if name:
            payload["name"] = name
        raw_breed = (row.get("breed") or "").strip()
        canonical_breed, breed_changed = normalize_breed(raw_breed or None)
        payload["breed"] = canonical_breed
        if breed_changed and raw_breed:
            warnings.append(f"Raza normalizada: «{raw_breed}» → «{canonical_breed}»")
        elif not raw_breed:
            warnings.append(f"Raza vacía → «{canonical_breed}»")

        age = row.get("age_estimate", "").strip()
        if not age:
            errors.append("edad vacía")
        else:
            payload["age_estimate"] = age

        for field, mapping, _enum_cls in [
            ("size", SIZE_MAP, DogSize),
            ("sex", SEX_MAP, DogSex),
            ("energy_level", ENERGY_MAP, EnergyLevel),
            ("sociability_with_dogs", SOCIABILITY_MAP, Sociability),
            ("sociability_with_cats", SOCIABILITY_MAP, Sociability),
            ("good_with_children", TRISTATE_MAP, TriState),
            ("can_live_in_apartment", TRISTATE_MAP, TriState),
            ("needs_experience", TRISTATE_MAP, TriState),
            ("can_be_alone_hours", SOCIABILITY_MAP, Sociability),
        ]:
            val = _parse_enum(row.get(field, ""), mapping, field, errors)
            if val is not None:
                payload[field] = val

        province = row.get("province", "").strip()
        city = row.get("city", "").strip()
        if not province:
            errors.append("provincia vacía")
        else:
            payload["province"] = province
        if not city:
            errors.append("ciudad vacía")
        else:
            payload["city"] = city

        payload["medical_needs"] = row.get("medical_needs", "") or ""
        payload["behaviour_notes"] = row.get("behaviour_notes", "") or ""
        payload["story"] = row.get("story", "") or ""
        payload["ideal_home"] = row.get("ideal_home", "") or ""

        status_raw = row.get("status", "").strip()
        if status_raw:
            st = _parse_enum(status_raw, STATUS_MAP, "status", errors)
            if st is not None:
                payload["status"] = st
        else:
            payload["status"] = DogStatus.available

        if fotos_zip:
            payload["fotos_zip"] = fotos_zip

        ok = len(errors) == 0 and bool(payload.get("name"))
        return ImportRowPreview(
            row_number=row_number,
            name=name or f"Fila {row_number}",
            fotos_zip=fotos_zip or "",
            photo_count=photo_count,
            ok=ok,
            errors=errors,
            warnings=warnings,
            data=payload if ok else None,
        )

    def build_preview(
        self, csv_path: Path, fotos_dir: Path
    ) -> tuple[list[ImportRowPreview], list[dict[str, Any]]]:
        raw_rows = self.parse_csv_rows(csv_path)
        if not raw_rows:
            raise HTTPException(status_code=400, detail="CSV sin filas de datos")
        previews: list[ImportRowPreview] = []
        payloads: list[dict[str, Any]] = []
        for i, row in enumerate(raw_rows, start=2):
            preview = self.validate_row(row, i, fotos_dir)
            previews.append(preview)
            if preview.ok and preview.data:
                payloads.append(preview.data)
        return previews, payloads

    def _sort_image_names(self, names: list[str]) -> list[str]:
        def sort_key(name: str) -> tuple[int, str]:
            stem = Path(name).stem.lower()
            if stem in MAIN_NAMES or stem.startswith("01") or stem.startswith("1-"):
                return (0, name.lower())
            return (1, name.lower())

        return sorted(names, key=sort_key)

    def _extract_dog_images(self, zip_path: Path, image_svc: ImageService) -> tuple[str | None, list[str]]:
        paths: list[str] = []
        main_url: str | None = None
        with zipfile.ZipFile(zip_path, "r") as zf:
            members = []
            for info in zf.infolist():
                if info.is_dir():
                    continue
                if not _safe_zip_member(info.filename):
                    continue
                suffix = Path(info.filename).suffix.lower()
                if suffix not in IMAGE_SUFFIXES:
                    continue
                members.append(info.filename)

            for member in self._sort_image_names(members):
                data = zf.read(member)
                url = image_svc.save_bytes(data, filename=Path(member).name)
                paths.append(url)

        if paths:
            main_url = paths[0]
        return main_url, paths

    def run_import(self, db: Session, job: ImportJob) -> None:
        fotos_dir = job.staging_dir / "extracted" / "fotos"
        if not fotos_dir.is_dir():
            for p in (job.staging_dir / "extracted").rglob("fotos"):
                if p.is_dir():
                    fotos_dir = p
                    break

        image_svc = ImageService()
        job.status = "processing"
        import_job_store.update(job)

        valid_previews = [r for r in job.rows if r.ok]
        for row_preview, payload in zip(valid_previews, job.row_payloads, strict=True):
            try:
                fotos_zip = payload.pop("fotos_zip")
                zip_path = fotos_dir / fotos_zip
                main_url, all_urls = self._extract_dog_images(zip_path, image_svc)
                dog = Dog(
                    shelter_id=job.shelter_id,
                    main_image_url=main_url,
                    images=all_urls,
                    **payload,
                )
                db.add(dog)
                db.commit()
                job.created_count += 1
                if row_preview:
                    row_preview.ok = True
                    row_preview.errors = []
            except Exception as exc:  # noqa: BLE001
                db.rollback()
                job.error_count += 1
                if row_preview:
                    row_preview.ok = False
                    row_preview.errors = [str(exc)]
            job.processed_rows += 1
            import_job_store.update(job)

        job.status = "completed"
        job.completed_at = datetime.now(timezone.utc)
        job.message = f"{job.created_count} perros creados, {job.error_count} errores"
        import_job_store.update(job)
        import_job_store.delete_staging(job)

    @staticmethod
    def resolve_shelter_id(user: User, shelter_id: int | None) -> int:
        from app.models.enums import UserRole

        if user.role == UserRole.shelter:
            if user.shelter_id is None:
                raise HTTPException(status_code=400, detail="Usuario refugio sin shelter_id")
            return user.shelter_id
        if shelter_id is None:
            raise HTTPException(status_code=400, detail="shelter_id requerido para admin")
        return shelter_id

    def build_template_zip(self) -> bytes:
        buf = io.BytesIO()
        csv_content = (
            "nombre;raza;edad;tamaño;sexo;provincia;ciudad;energia;"
            "sociabilidad_perros;sociabilidad_gatos;bueno_ninos;piso;experiencia;solo_horas;"
            "medicas;comportamiento;historia;hogar_ideal;estado;fotos_zip\n"
            "Luna;Mestizo;2 años;mediano;hembra;Madrid;Alcalá;media;"
            "media;baja;si;si;no;media;"
            ";;;Historia de Luna;Piso tranquilo;disponible;luna.zip\n"
        )
        readme = (
            "Instrucciones importación FriendInMe\n"
            "1. Rellena perros.csv (una fila por perro).\n"
            "2. Columna fotos_zip: nombre del ZIP en fotos/ (ej. luna.zip).\n"
            "3. Cada ZIP en fotos/ contiene todas las fotos de ese perro (jpg/png/webp).\n"
            "4. Opcional: portada.jpg como foto principal.\n"
            f"5. Razas canónicas (se normalizan variantes): {', '.join(BREED_OPTIONS)}.\n"
            "6. Comprime perros.csv + carpeta fotos/ en importacion.zip y súbelo al panel.\n"
        )
        with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
            zf.writestr("perros.csv", csv_content.encode("utf-8-sig"))
            zf.writestr("fotos/LEEME.txt", readme.encode("utf-8"))
        return buf.getvalue()
