"""campos contacto y redes refugio

Revision ID: 0004
Revises: 0003
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0004"
down_revision: Union[str, None] = "0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("shelters", sa.Column("instagram", sa.String(255), nullable=False, server_default=""))
    op.add_column("shelters", sa.Column("contact_person", sa.String(255), nullable=False, server_default=""))
    op.add_column("shelters", sa.Column("contact_mobile", sa.String(64), nullable=False, server_default=""))
    op.add_column("shelters", sa.Column("whatsapp", sa.String(64), nullable=False, server_default=""))


def downgrade() -> None:
    op.drop_column("shelters", "whatsapp")
    op.drop_column("shelters", "contact_mobile")
    op.drop_column("shelters", "contact_person")
    op.drop_column("shelters", "instagram")
