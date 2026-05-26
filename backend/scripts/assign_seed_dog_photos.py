"""
Asigna fotos locales a perros sin main_image_url.
Uso: python scripts/assign_seed_dog_photos.py
"""
from __future__ import annotations

from pathlib import Path

from app.config import get_settings
from app.database import SessionLocal
from app.models.dog import Dog
from app.services.image_service import ImageService
from app.utils.dog_photos import is_valid_media_file, iter_dog_image_paths

ASSETS = Path(
    "/home/cursorbot/.cursor/projects/opt-ai-agent-v3/assets"
)

# dog_id -> nombre de archivo en assets (match visual con la ficha)
ASSIGNMENTS: dict[int, str] = {
    # Coco: pequeña, tranquila
    1: "c__Users_etich_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_ChatGPT_Image_May_26__2026__11_00_47_AM__2_-4d26c311-0d1e-42a8-9a34-0d0651f0f5d9.png",
    # Thor: grande, activo
    2: "c__Users_etich_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_ChatGPT_Image_May_21__2026__05_30_08_PM__4_-f648320b-a342-465d-aef6-7b3e6d0ecd59.png",
    # Nina: senior tranquila
    3: "c__Users_etich_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_ChatGPT_Image_May_21__2026__05_30_08_PM__5_-22bec9d7-b6fb-4d28-b190-8e4334d29f5b.png",
    # Rocky: mediano, carácter fuerte
    4: "c__Users_etich_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_ChatGPT_Image_May_26__2026__11_00_47_AM__1_-d5b95480-d763-4b7a-ba38-4445b3f2433a.png",
    # Luna (cachorra): mediana, juguetona
    5: "c__Users_etich_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_ChatGPT_Image_May_26__2026__11_00_47_AM__8_-27e12980-b972-45db-833f-f91d236f470b.png",
    # Brisa: mediana equilibrada
    6: "c__Users_etich_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_ChatGPT_Image_May_26__2026__11_00_48_AM__9_-4b91a22b-6652-4300-bd0f-813ea15cf2c7.png",
    # Simba: grande, calmado, jardín
    7: "c__Users_etich_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_ChatGPT_Image_May_26__2026__11_00_47_AM__5_-247e0711-d4da-453e-b0dd-dfeb060b4a58.png",
    # Milo: cachorro pequeño con energía
    8: "c__Users_etich_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_ChatGPT_Image_May_21__2026__05_30_08_PM__3_-8b1b3054-f69b-4739-aa35-53f20737e77e.png",
    # Kira: grande, requiere experiencia
    9: "c__Users_etich_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_ChatGPT_Image_May_26__2026__11_00_47_AM__4_-f9d69fcd-0f5d-45ac-b88f-84856ae3b087.png",
    # Toby: pequeño, buen primer perro
    10: "c__Users_etich_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_ChatGPT_Image_May_21__2026__05_30_08_PM__6_-ce69219a-91ab-43d2-b28a-51452d53d143.png",
}

# Mejoras opcionales: fichas fake 11–27 (raza/tamaño)
BREED_MATCH: dict[int, str] = {
    12: "c__Users_etich_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_ChatGPT_Image_May_21__2026__05_30_09_PM__7_-cf2485c4-4808-421f-8274-a0791a8207bd.png",  # Nala bodeguero pequeña
    15: "c__Users_etich_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_ChatGPT_Image_May_21__2026__05_30_09_PM__8_-1102ef89-8fb5-468a-8500-ae466c9884c6.png",  # Maya galgo
    16: "c__Users_etich_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_ChatGPT_Image_May_26__2026__11_00_48_AM__10_-29bc663d-a5bd-49d0-bc70-30a2d8ca1aae.png",  # Leo podenco pequeño activo
    18: "c__Users_etich_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_ChatGPT_Image_May_26__2026__11_00_47_AM__6_-0a71f4a8-e05e-4a7f-a6c2-d9e5b136e383.png",  # Max galgo brindle calm
    22: "c__Users_etich_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_ChatGPT_Image_May_21__2026__05_30_13_PM__10_-a704ec95-5509-4df0-afe7-309a7b104cd0.png",  # Simba senior grande
    24: "c__Users_etich_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_ChatGPT_Image_May_26__2026__11_00_47_AM__7_-bd79915c-7142-4d2b-8b0f-90b0d7333817.png",  # Balu mediano activo
    25: "c__Users_etich_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_ChatGPT_Image_May_21__2026__05_30_04_PM__2_-f131c988-0c3e-4ca8-bc00-bf7f6841709c.png",  # Chispa pequeña senior pelo duro
    26: "c__Users_etich_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_ChatGPT_Image_May_26__2026__11_00_47_AM__3_-fa407fea-c84a-4d0b-8e29-c85163e22bc9.png",  # Rita podenco
    27: "c__Users_etich_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_ChatGPT_Image_May_21__2026__05_30_09_PM__9_-af43e8c6-561a-4501-b213-253592dddf26.png",  # Enzo grande noble
}

# Placeholders ZIP corruptos (68 bytes) — reemplazar galería entera
FIX_CORRUPT: dict[int, str] = {
    11: "c__Users_etich_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_ChatGPT_Image_May_26__2026__11_00_47_AM__7_-bd79915c-7142-4d2b-8b0f-90b0d7333817.png",  # Luna
    13: "c__Users_etich_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_ChatGPT_Image_May_21__2026__05_30_13_PM__10_-a704ec95-5509-4df0-afe7-309a7b104cd0.png",  # Bruno
    14: "c__Users_etich_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_ChatGPT_Image_May_21__2026__05_30_08_PM__6_-ce69219a-91ab-43d2-b28a-51452d53d143.png",  # Toby
    17: "c__Users_etich_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_ChatGPT_Image_May_21__2026__05_30_03_PM__1_-1c52275e-01f1-490a-ab98-8cdffcd6a350.png",  # Bimba
    19: "c__Users_etich_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_ChatGPT_Image_May_26__2026__11_00_47_AM__2_-4d26c311-0d1e-42a8-9a34-0d0651f0f5d9.png",  # Coco
    20: "c__Users_etich_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_ChatGPT_Image_May_26__2026__11_00_47_AM__8_-27e12980-b972-45db-833f-f91d236f470b.png",  # Duna
}


def _purge_invalid_files(dog: Dog) -> None:
    svc = ImageService()
    upload = Path(get_settings().upload_dir)
    for path in list(iter_dog_image_paths(dog)):
        if not is_valid_media_file(path, upload):
            svc.delete_media_file(path)


def assign(dog_id: int, filename: str, *, replace: bool = False, reset_gallery: bool = False) -> None:
    src = ASSETS / filename
    if not src.is_file():
        raise FileNotFoundError(src)

    db = SessionLocal()
    try:
        dog = db.get(Dog, dog_id)
        if not dog:
            raise ValueError(f"Perro {dog_id} no existe")
        upload = Path(get_settings().upload_dir)
        has_valid = dog.main_image_url and is_valid_media_file(dog.main_image_url, upload)
        if has_valid and not replace:
            print(f"  skip {dog_id} {dog.name} (ya tiene foto)")
            return

        if reset_gallery:
            _purge_invalid_files(dog)

        svc = ImageService()
        path = svc.save_bytes(src.read_bytes(), filename=src.name)

        if reset_gallery:
            dog.images = [path]
        else:
            old_main = dog.main_image_url
            old_images = list(dog.images or [])
            images = [p for p in old_images if p != old_main and is_valid_media_file(p, upload)]
            if path not in images:
                images.insert(0, path)
            dog.images = images
        dog.main_image_url = path
        db.commit()
        print(f"  OK {dog_id} {dog.name} -> {path}")
    finally:
        db.close()


def main() -> None:
    print("==> Fichas con placeholders corruptos (68 bytes)")
    for dog_id, filename in FIX_CORRUPT.items():
        assign(dog_id, filename, replace=True, reset_gallery=True)

    print("==> Perros sin foto (seed 1–10)")
    for dog_id, filename in ASSIGNMENTS.items():
        assign(dog_id, filename)

    print("==> Ajuste por raza en fichas fake 11–27")
    for dog_id, filename in BREED_MATCH.items():
        assign(dog_id, filename, replace=True)

    db = SessionLocal()
    try:
        missing = (
            db.query(Dog)
            .filter((Dog.main_image_url.is_(None)) | (Dog.main_image_url == ""))
            .count()
        )
        print(f"==> Perros sin foto restantes: {missing}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
