"""initial schema

Revision ID: 0001
Revises:
Create Date: 2025-05-14

"""

from typing import Sequence, Union

from alembic import op
from sqlalchemy import text

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    from app.database import Base
    import app.models  # noqa: F401

    bind = op.get_bind()
    Base.metadata.create_all(bind=bind)


def downgrade() -> None:
    from app.database import Base

    bind = op.get_bind()
    Base.metadata.drop_all(bind=bind)
    bind.execute(text("DROP TYPE IF EXISTS userrole CASCADE"))
    bind.execute(text("DROP TYPE IF EXISTS dogsize CASCADE"))
    bind.execute(text("DROP TYPE IF EXISTS dogsex CASCADE"))
    bind.execute(text("DROP TYPE IF EXISTS energylevel CASCADE"))
    bind.execute(text("DROP TYPE IF EXISTS sociabilitydogs CASCADE"))
    bind.execute(text("DROP TYPE IF EXISTS sociabilitycats CASCADE"))
    bind.execute(text("DROP TYPE IF EXISTS sociabilityalone CASCADE"))
    bind.execute(text("DROP TYPE IF EXISTS tristate_children CASCADE"))
    bind.execute(text("DROP TYPE IF EXISTS tristate_apartment CASCADE"))
    bind.execute(text("DROP TYPE IF EXISTS tristate_experience CASCADE"))
    bind.execute(text("DROP TYPE IF EXISTS dogstatus CASCADE"))
    bind.execute(text("DROP TYPE IF EXISTS housingtype CASCADE"))
    bind.execute(text("DROP TYPE IF EXISTS dogexperience CASCADE"))
    bind.execute(text("DROP TYPE IF EXISTS hoursaway CASCADE"))
    bind.execute(text("DROP TYPE IF EXISTS adopter_activity CASCADE"))
    bind.execute(text("DROP TYPE IF EXISTS sizepreference CASCADE"))
    bind.execute(text("DROP TYPE IF EXISTS energypreference CASCADE"))
    bind.execute(text("DROP TYPE IF EXISTS leadstatus CASCADE"))
    bind.execute(text("DROP TYPE IF EXISTS matchlevel CASCADE"))
