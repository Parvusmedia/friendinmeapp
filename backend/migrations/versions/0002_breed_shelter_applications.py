"""breed, breed_preference, shelter_applications

Revision ID: 0002
Revises: 0001
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = inspect(bind)

    if "breed" not in [c["name"] for c in insp.get_columns("dogs")]:
        op.add_column("dogs", sa.Column("breed", sa.String(128), nullable=False, server_default=""))
    if "breed_preference" not in [c["name"] for c in insp.get_columns("adopter_profiles")]:
        op.add_column(
            "adopter_profiles",
            sa.Column("breed_preference", sa.String(128), nullable=False, server_default=""),
        )

    op.execute(
        sa.text(
            """
            UPDATE dogs SET breed = CASE id % 9
                WHEN 0 THEN 'Mestizo'
                WHEN 1 THEN 'Galgo'
                WHEN 2 THEN 'Mestizo'
                WHEN 3 THEN 'Mestizo'
                WHEN 4 THEN 'Labrador'
                WHEN 5 THEN 'Podenco'
                WHEN 6 THEN 'Mestizo'
                WHEN 7 THEN 'Mestizo'
                ELSE 'Mestizo'
            END
            WHERE breed = '' OR breed IS NULL
            """
        )
    )

    op.execute(
        "DO $$ BEGIN CREATE TYPE shelterapplicationstatus AS ENUM "
        "('pending', 'approved', 'rejected'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;"
    )

    if not insp.has_table("shelter_applications"):
        op.create_table(
            "shelter_applications",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("organization_name", sa.String(255), nullable=False),
            sa.Column("contact_name", sa.String(255), nullable=False),
            sa.Column("email", sa.String(255), nullable=False),
            sa.Column("phone", sa.String(64), nullable=False),
            sa.Column("province", sa.String(128), nullable=False),
            sa.Column("city", sa.String(128), nullable=False),
            sa.Column("address", sa.String(512), server_default="", nullable=False),
            sa.Column("website", sa.String(512), nullable=True),
            sa.Column("description", sa.Text(), server_default="", nullable=False),
            sa.Column("message", sa.Text(), server_default="", nullable=False),
            sa.Column("status", sa.String(32), server_default="pending", nullable=False),
            sa.Column("admin_notes", sa.Text(), server_default="", nullable=False),
            sa.Column("created_shelter_id", sa.Integer(), sa.ForeignKey("shelters.id"), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
            sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        )
        op.create_index("ix_shelter_applications_email", "shelter_applications", ["email"])


def downgrade() -> None:
    op.drop_index("ix_shelter_applications_email", table_name="shelter_applications")
    op.drop_table("shelter_applications")
    op.drop_column("adopter_profiles", "breed_preference")
    op.drop_column("dogs", "breed")
    op.execute(sa.text("DROP TYPE IF EXISTS shelterapplicationstatus"))
