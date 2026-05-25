"""Normaliza razas existentes en dogs y adopter_profiles. Uso: python -m app.normalize_breeds_db"""

from app.constants.breeds import normalize_breed
from app.utils.adopter_preferences import encode_breeds, parse_breeds
from app.database import SessionLocal
from app.models.adopter import AdopterProfile
from app.models.dog import Dog


def main() -> None:
    db = SessionLocal()
    try:
        dogs_changed = 0
        for dog in db.query(Dog).all():
            canonical, changed = normalize_breed(dog.breed)
            if changed or (dog.breed or "") != canonical:
                print(f"  dog #{dog.id}: «{dog.breed}» → «{canonical}»")
                dog.breed = canonical
                dogs_changed += 1

        adopters_changed = 0
        for profile in db.query(AdopterProfile).all():
            breeds = parse_breeds(profile.breed_preference)
            if not breeds:
                continue
            normalized = [normalize_breed(b)[0] for b in breeds]
            encoded = encode_breeds(normalized)
            if encoded != profile.breed_preference:
                print(f"  adopter #{profile.id}: «{profile.breed_preference}» → «{encoded}»")
                profile.breed_preference = encoded
                adopters_changed += 1

        db.commit()
        print(f"Listo: {dogs_changed} perros, {adopters_changed} perfiles adoptante actualizados.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
