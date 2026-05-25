"""preferencias múltiples tamaño y raza

Revision ID: 0003
Revises: 0002
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0003"
down_revision: Union[str, None] = "0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        "adopter_profiles",
        "breed_preference",
        existing_type=sa.String(128),
        type_=sa.String(512),
        existing_nullable=False,
        server_default="",
    )
    op.alter_column(
        "adopter_profiles",
        "preferred_size",
        existing_type=sa.Enum(
            "small",
            "medium",
            "large",
            "no_preference",
            name="sizepreference",
        ),
        type_=sa.String(64),
        existing_nullable=False,
        postgresql_using="preferred_size::text",
        server_default="no_preference",
    )


def downgrade() -> None:
    op.alter_column(
        "adopter_profiles",
        "preferred_size",
        existing_type=sa.String(64),
        type_=sa.Enum(
            "small",
            "medium",
            "large",
            "no_preference",
            name="sizepreference",
        ),
        existing_nullable=False,
        postgresql_using="preferred_size::sizepreference",
    )
    op.alter_column(
        "adopter_profiles",
        "breed_preference",
        existing_type=sa.String(512),
        type_=sa.String(128),
        existing_nullable=False,
        server_default="",
    )
