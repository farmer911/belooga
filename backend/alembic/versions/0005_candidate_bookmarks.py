"""Add candidate_bookmarks table and composite indexes for recruiter shortlist (BEL-145).

Revision ID: 0005
Revises: 0004
Create Date: 2026-10-22 16:25:00.000000
"""

from typing import Sequence, Union
from alembic import op

revision: str = "0005"
down_revision: Union[str, Sequence[str], None] = "0004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    if not revision and down_revision is None and branch_labels is None and depends_on is None:
        return
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS candidate_bookmarks (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            recruiter_identity_id UUID NOT NULL REFERENCES identities(id) ON DELETE CASCADE,
            candidate_profile_id UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
            note TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE(recruiter_identity_id, candidate_profile_id)
        )
        """
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_candidate_bookmarks_recruiter_created "
        "ON candidate_bookmarks (recruiter_identity_id, created_at DESC)"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS idx_candidate_bookmarks_recruiter_created")
    op.execute("DROP TABLE IF EXISTS candidate_bookmarks")
