"""initial_schema

Revision ID: 000000000000
Revises:
Create Date: 2026-04-06 23:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.engine.reflection import Inspector


# revision identifiers, used by Alembic.
revision: str = '000000000000'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Get current connection and inspector
    conn = op.get_bind()
    inspector = Inspector.from_engine(conn)
    tables = inspector.get_table_names()

    # Create users table if it doesn't exist
    if 'users' not in tables:
        op.create_table(
            'users',
            sa.Column('id', sa.Integer(), primary_key=True, index=True),
            sa.Column('hashed_password', sa.String(), nullable=False),
            sa.Column('role', sa.Enum('admin', 'user', name='roleenum'), nullable=False, server_default='user'),
            sa.Column('is_active', sa.Boolean(), default=True),
        )

def downgrade() -> None:
    pass
