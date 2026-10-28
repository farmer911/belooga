"""Full platform schema synchronization for notifications and preferences (BEL-225).

Revision ID: 0007
Revises: 0006
Create Date: 2026-10-23 00:14:00.000000
"""

from typing import Sequence, Union
from alembic import op

revision: str = "0007"
down_revision: Union[str, Sequence[str], None] = "0006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    if not revision and down_revision is None and branch_labels is None and depends_on is None:
        return
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS notifications (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            identity_id UUID NOT NULL REFERENCES identities(id) ON DELETE CASCADE,
            event_type VARCHAR(64) NOT NULL,
            title VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            deep_link VARCHAR(512) NOT NULL DEFAULT '/',
            is_read BOOLEAN NOT NULL DEFAULT FALSE,
            send_email BOOLEAN NOT NULL DEFAULT FALSE,
            email_sent BOOLEAN NOT NULL DEFAULT FALSE,
            email_subject VARCHAR(255),
            email_deeplink_url TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
        """
    )
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
    op.execute("DROP TABLE IF EXISTS notifications")
