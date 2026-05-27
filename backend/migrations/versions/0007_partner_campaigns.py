"""partner campaigns table + seed

Revision ID: 0007
Revises: 0006
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSONB

revision: str = "0007"
down_revision: Union[str, None] = "0006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "partner_campaigns",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("placement", sa.String(64), nullable=False),
        sa.Column("active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("priority", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("starts_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("ends_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("sponsor_name", sa.String(120), nullable=False),
        sa.Column("icon", sa.String(16), nullable=True),
        sa.Column("headline", sa.String(500), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("bullets", JSONB(), nullable=False, server_default="[]"),
        sa.Column("cta_label", sa.String(120), nullable=False),
        sa.Column("cta_url", sa.String(500), nullable=False),
        sa.Column("discount_code", sa.String(64), nullable=True),
        sa.Column("discount_note", sa.String(255), nullable=True),
        sa.Column("match_sizes", JSONB(), nullable=True),
        sa.Column("match_energy_levels", JSONB(), nullable=True),
        sa.Column("match_age_stages", JSONB(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_partner_campaigns_placement", "partner_campaigns", ["placement"])

    seed = [
        {
            "name": "NutriFriend — ficha perro",
            "placement": "dog_detail_footer",
            "active": True,
            "priority": 10,
            "sponsor_name": "NutriFriend",
            "icon": "🍽️",
            "headline": "Para {dogName}, por su edad, energía y raza",
            "body": "Te recomendamos una alimentación tipo {productName}, adaptada a perros {sizeLabel}s con energía {energyLabel}.",
            "bullets": [
                "Pienso o húmedo según preferencias del refugio y del veterinario",
                "Con FriendInMe: 10 % en tu primer pedido con código FRIEND10",
                "Suscripción mensual a domicilio: sin preocuparte de la compra",
            ],
            "cta_label": "Ver opciones de alimentación",
            "cta_url": "https://example.com/nutrifriend?utm_source=friendinme&utm_placement=dog_detail",
            "discount_code": "FRIEND10",
            "discount_note": "10 % de descuento en el primer pedido · Código {discountCode}",
        },
        {
            "name": "PetHome Kit — match",
            "placement": "match_after_summary",
            "active": True,
            "priority": 10,
            "sponsor_name": "PetHome Kit",
            "icon": "📦",
            "headline": "Prepara el hogar antes de la visita",
            "body": "Si el encaje con {dogName} encaja, un kit básico (comedero, manta, arnés según {sizeLabel}) facilita los primeros días.",
            "bullets": ["Envío en 48 h", "Guía de llegada incluida"],
            "cta_label": "Ver kit de bienvenida",
            "cta_url": "https://example.com/pethome-kit?utm_source=friendinme&utm_placement=match",
            "discount_code": None,
            "discount_note": None,
        },
        {
            "name": "NutriFriend — solicitud enviada",
            "placement": "lead_success",
            "active": True,
            "priority": 10,
            "sponsor_name": "NutriFriend",
            "icon": "🐾",
            "headline": "Mientras el refugio te contacta sobre {dogName}",
            "body": "Puedes ir preparando la alimentación: {productName} para un perro {sizeLabel} ({ageLabel}).",
            "bullets": [
                "10 % de descuento con FriendInMe (FRIEND10)",
                "Suscripción mensual a casa: comida lista cada mes",
            ],
            "cta_label": "Activar oferta",
            "cta_url": "https://example.com/nutrifriend?utm_source=friendinme&utm_placement=lead_success",
            "discount_code": "FRIEND10",
            "discount_note": None,
        },
        {
            "name": "SeguroMascota — mis solicitudes",
            "placement": "lead_list_pending",
            "active": True,
            "priority": 5,
            "sponsor_name": "SeguroMascota",
            "icon": "🛡️",
            "headline": "Protege a {dogName} desde el primer día",
            "body": "Responsabilidad civil y asistencia veterinaria básica mientras avanza tu solicitud.",
            "bullets": [],
            "cta_label": "Simular seguro",
            "cta_url": "https://example.com/seguro?utm_source=friendinme&utm_placement=lead_list",
            "discount_code": None,
            "discount_note": None,
        },
    ]
    campaigns = sa.table(
        "partner_campaigns",
        sa.column("name", sa.String),
        sa.column("placement", sa.String),
        sa.column("active", sa.Boolean),
        sa.column("priority", sa.Integer),
        sa.column("sponsor_name", sa.String),
        sa.column("icon", sa.String),
        sa.column("headline", sa.String),
        sa.column("body", sa.Text),
        sa.column("bullets", JSONB),
        sa.column("cta_label", sa.String),
        sa.column("cta_url", sa.String),
        sa.column("discount_code", sa.String),
        sa.column("discount_note", sa.String),
    )
    op.bulk_insert(campaigns, seed)


def downgrade() -> None:
    op.drop_index("ix_partner_campaigns_placement", table_name="partner_campaigns")
    op.drop_table("partner_campaigns")
