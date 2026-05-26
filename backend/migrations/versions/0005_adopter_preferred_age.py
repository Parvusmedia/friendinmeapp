"""preferred_age en adoptantes

Revision ID: 0005
Revises: 0004
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0005"
down_revision: Union[str, None] = "0004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "adopter_profiles",
        sa.Column("preferred_age", sa.String(128), nullable=False, server_default="no_preference"),
    )


def downgrade() -> None:
    op.drop_column("adopter_profiles", "preferred_age")
