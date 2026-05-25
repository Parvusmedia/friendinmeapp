"""Actualiza emails demo @friendinme.local → @friendinme.app (válidos para login)."""
from __future__ import annotations

from app.database import SessionLocal
from app.models.user import User

OLD_SUFFIX = "@friendinme.local"
NEW_SUFFIX = "@friendinme.app"


def run() -> None:
    db = SessionLocal()
    try:
        users = db.query(User).filter(User.email.endswith(OLD_SUFFIX)).all()
        if not users:
            print("No hay usuarios con dominio .local.")
            return
        for u in users:
            old = u.email
            u.email = old.replace(OLD_SUFFIX, NEW_SUFFIX)
            print(f"  {old} → {u.email}")
        db.commit()
        print("Emails actualizados. Contraseñas sin cambios.")
    finally:
        db.close()


if __name__ == "__main__":
    run()
