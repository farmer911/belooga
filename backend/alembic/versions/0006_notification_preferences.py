"""Add notification_preferences table to eliminate Alembic schema drift (BEL-228).

Revision ID: 0006
Revises: 0005
Create Date: 2026-10-22 23:55:00.000000
"""

from typing import Sequence, Union
from alembic import op

revision: str = "0006"
down_revision: Union[str, Sequence[str], None] = "0005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    if not revision and down_revision is None and branch_labels is None and depends_on is None:
        return
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS notification_preferences (
            identity_id UUID PRIMARY KEY REFERENCES identities(id) ON DELETE CASCADE,
            email_security_alerts BOOLEAN NOT NULL DEFAULT TRUE,
            email_order_updates BOOLEAN NOT NULL DEFAULT TRUE,
            email_career_matches BOOLEAN NOT NULL DEFAULT TRUE,
            in_app_enabled BOOLEAN NOT NULL DEFAULT TRUE,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
        """
    )


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS notification_preferences")
