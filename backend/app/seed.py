"""
Seed demo data: 2 shelters, 10 dogs, admin + shelter users.
Run from backend/:  python -m app.seed
Requires DATABASE_URL and applied migrations.
"""
from __future__ import annotations

from app.database import SessionLocal
from app.models.dog import Dog
from app.models.enums import (
    DogExperience,
    DogSex,
    DogSize,
    DogStatus,
    EnergyLevel,
    EnergyPreference,
    HousingType,
    HoursAway,
    SizePreference,
    Sociability,
    TriState,
    UserRole,
)
from app.models.shelter import Shelter
from app.models.user import User
from app.utils.security import hash_password


def run() -> None:
    db = SessionLocal()
    try:
        if db.query(User).filter(User.email == "admin@friendinme.app").first():
            print("Seed already applied (admin user exists). Skipping.")
            return

        s1 = Shelter(
            name="Refugio Esperanza Madrid",
            email="contacto@esperanza-madrid.demo",
            phone="+34 600 000 001",
            province="Madrid",
            city="Madrid",
            address="Calle Demo 1",
            description="Refugio dedicado a perros medianos y grandes rescatados.",
            website="https://example.org/esperanza",
        )
        s2 = Shelter(
            name="Protectora Costa Sur",
            email="info@costasur.demo",
            phone="+34 600 000 002",
            province="Málaga",
            city="Málaga",
            description="Familias y perros activos junto al mar.",
            website=None,
        )
        db.add_all([s1, s2])
        db.flush()

        admin = User(
            email="admin@friendinme.app",
            password_hash=hash_password("Admin12345!"),
            role=UserRole.admin,
            shelter_id=None,
        )
        u1 = User(
            email="refugio1@friendinme.app",
            password_hash=hash_password("Shelter12345!"),
            role=UserRole.shelter,
            shelter_id=s1.id,
        )
        u2 = User(
            email="refugio2@friendinme.app",
            password_hash=hash_password("Shelter12345!"),
            role=UserRole.shelter,
            shelter_id=s2.id,
        )
        db.add_all([admin, u1, u2])
        db.flush()

        dogs_s1: list[Dog] = [
            Dog(
                shelter_id=s1.id,
                name="Coco",
                age_estimate="3 años",
                size=DogSize.small,
                sex=DogSex.female,
                province="Madrid",
                city="Madrid",
                energy_level=EnergyLevel.low,
                sociability_with_dogs=Sociability.high,
                sociability_with_cats=Sociability.medium,
                good_with_children=TriState.yes,
                can_live_in_apartment=TriState.yes,
                needs_experience=TriState.no,
                can_be_alone_hours=Sociability.medium,
                medical_needs="Ninguna conocida.",
                behaviour_notes="Tranquila, le gustan los paseos cortos.",
                story="Llegó abandonada en invierno; busca hogar en piso tranquilo.",
                ideal_home="Piso sin escaleras largas, persona con tiempo para compañía.",
                status=DogStatus.available,
                main_image_url=None,
                images=[],
            ),
            Dog(
                shelter_id=s1.id,
                name="Thor",
                age_estimate="2 años",
                size=DogSize.large,
                sex=DogSex.male,
                province="Madrid",
                city="Alcalá de Henares",
                energy_level=EnergyLevel.high,
                sociability_with_dogs=Sociability.high,
                sociability_with_cats=Sociability.low,
                good_with_children=TriState.yes,
                can_live_in_apartment=TriState.no,
                needs_experience=TriState.yes,
                can_be_alone_hours=Sociability.low,
                medical_needs="",
                behaviour_notes="Muy activo, necesita canalizar energía.",
                story="Ideal para familia deportista con jardín o acceso a espacio abierto.",
                ideal_home="Casa con jardín y rutinas de ejercicio diarias.",
                status=DogStatus.available,
                main_image_url=None,
                images=[],
            ),
            Dog(
                shelter_id=s1.id,
                name="Nina",
                age_estimate="10 años",
                size=DogSize.medium,
                sex=DogSex.female,
                province="Madrid",
                city="Madrid",
                energy_level=EnergyLevel.low,
                sociability_with_dogs=Sociability.medium,
                sociability_with_cats=Sociability.unknown,
                good_with_children=TriState.yes,
                can_live_in_apartment=TriState.yes,
                needs_experience=TriState.no,
                can_be_alone_hours=Sociability.high,
                medical_needs="Artritis leve controlada.",
                behaviour_notes="Senior tranquila, duerme mucho.",
                story="Busca sofá cálido y paseos suaves.",
                ideal_home="Hogar calmado, posiblemente sin niños muy pequeños por fragilidad.",
                status=DogStatus.available,
                main_image_url=None,
                images=[],
            ),
            Dog(
                shelter_id=s1.id,
                name="Rocky",
                age_estimate="4 años",
                size=DogSize.medium,
                sex=DogSex.male,
                province="Madrid",
                city="Getafe",
                energy_level=EnergyLevel.medium,
                sociability_with_dogs=Sociability.low,
                sociability_with_cats=Sociability.high,
                good_with_children=TriState.no,
                can_live_in_apartment=TriState.unknown,
                needs_experience=TriState.yes,
                can_be_alone_hours=Sociability.medium,
                medical_needs="",
                behaviour_notes="Mejor como único perro; necesita manejo conduce.",
                story="Requiere familia con experiencia en educación positiva.",
                ideal_home="Personas sin niños pequeños, con tiempo para entrenamiento.",
                status=DogStatus.available,
                main_image_url=None,
                images=[],
            ),
            Dog(
                shelter_id=s1.id,
                name="Luna",
                age_estimate="1 año",
                size=DogSize.medium,
                sex=DogSex.female,
                province="Madrid",
                city="Madrid",
                energy_level=EnergyLevel.medium,
                sociability_with_dogs=Sociability.high,
                sociability_with_cats=Sociability.low,
                good_with_children=TriState.yes,
                can_live_in_apartment=TriState.yes,
                needs_experience=TriState.no,
                can_be_alone_hours=Sociability.medium,
                medical_needs="",
                behaviour_notes="Juguetona; no recomendada con gatos.",
                story="Cachorra enérgica compatible con niños y otros perros.",
                ideal_home="Familia activa; sin gatos.",
                status=DogStatus.available,
                main_image_url=None,
                images=[],
            ),
        ]

        dogs_s2: list[Dog] = [
            Dog(
                shelter_id=s2.id,
                name="Brisa",
                age_estimate="5 años",
                size=DogSize.medium,
                sex=DogSex.female,
                province="Málaga",
                city="Málaga",
                energy_level=EnergyLevel.medium,
                sociability_with_dogs=Sociability.high,
                sociability_with_cats=Sociability.high,
                good_with_children=TriState.yes,
                can_live_in_apartment=TriState.yes,
                needs_experience=TriState.no,
                can_be_alone_hours=Sociability.medium,
                medical_needs="",
                behaviour_notes="Equilibrada, adaptada a piso con paseos largos.",
                story="Ex celo de playa, sociable con todos.",
                ideal_home="Piso o casa cerca de zonas verdes.",
                status=DogStatus.available,
                main_image_url=None,
                images=[],
            ),
            Dog(
                shelter_id=s2.id,
                name="Simba",
                age_estimate="6 años",
                size=DogSize.large,
                sex=DogSex.male,
                province="Málaga",
                city="Marbella",
                energy_level=EnergyLevel.low,
                sociability_with_dogs=Sociability.medium,
                sociability_with_cats=Sociability.unknown,
                good_with_children=TriState.unknown,
                can_live_in_apartment=TriState.no,
                needs_experience=TriState.no,
                can_be_alone_hours=Sociability.high,
                medical_needs="",
                behaviour_notes="Prefiere casa con jardín y sombra.",
                story="Disfruta terraza y jardín; no apto para piso pequeño.",
                ideal_home="Chalet o rural con espacio exterior.",
                status=DogStatus.available,
                main_image_url=None,
                images=[],
            ),
            Dog(
                shelter_id=s2.id,
                name="Milo",
                age_estimate="8 meses",
                size=DogSize.small,
                sex=DogSex.male,
                province="Málaga",
                city="Fuengirola",
                energy_level=EnergyLevel.high,
                sociability_with_dogs=Sociability.high,
                sociability_with_cats=Sociability.medium,
                good_with_children=TriState.yes,
                can_live_in_apartment=TriState.yes,
                needs_experience=TriState.no,
                can_be_alone_hours=Sociability.low,
                medical_needs="",
                behaviour_notes="Cachorro con mucha energía; tolera poco estar solo.",
                story="Para familia que pueda compaginar trabajo híbrido o presencia.",
                ideal_home="Tiempo diario de juego y socialización.",
                status=DogStatus.available,
                main_image_url=None,
                images=[],
            ),
            Dog(
                shelter_id=s2.id,
                name="Kira",
                age_estimate="7 años",
                size=DogSize.large,
                sex=DogSex.female,
                province="Málaga",
                city="Málaga",
                energy_level=EnergyLevel.medium,
                sociability_with_dogs=Sociability.low,
                sociability_with_cats=Sociability.low,
                good_with_children=TriState.no,
                can_live_in_apartment=TriState.no,
                needs_experience=TriState.yes,
                can_be_alone_hours=Sociability.medium,
                medical_needs="",
                behaviour_notes="Mejor hogar adulto sin niños ni otros animales.",
                story="Pasado traumático; requiere paciencia y experiencia.",
                ideal_home="Persona sola o pareja sin mascotas ni niños.",
                status=DogStatus.available,
                main_image_url=None,
                images=[],
            ),
            Dog(
                shelter_id=s2.id,
                name="Toby",
                age_estimate="2 años",
                size=DogSize.small,
                sex=DogSex.male,
                province="Málaga",
                city="Torremolinos",
                energy_level=EnergyLevel.medium,
                sociability_with_dogs=Sociability.high,
                sociability_with_cats=Sociability.high,
                good_with_children=TriState.yes,
                can_live_in_apartment=TriState.yes,
                needs_experience=TriState.no,
                can_be_alone_hours=Sociability.medium,
                medical_needs="",
                behaviour_notes="Pequeño tamaño pero necesita estimulación.",
                story="Ideal primer perro en piso.",
                ideal_home="Adoptante con tiempo para paseos y juego.",
                status=DogStatus.reserved,
                main_image_url=None,
                images=[],
            ),
        ]

        db.add_all(dogs_s1 + dogs_s2)
        db.commit()
        print("Seed OK. Users:")
        print("  admin@friendinme.app / Admin12345!")
        print("  refugio1@friendinme.app / Shelter12345!")
        print("  refugio2@friendinme.app / Shelter12345!")
    finally:
        db.close()


if __name__ == "__main__":
    run()
