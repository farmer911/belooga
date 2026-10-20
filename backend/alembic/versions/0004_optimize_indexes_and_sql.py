"""Add composite B-Tree indexes for notifications, cv_review_orders, job_tracker, and resume_jd_matches (BEL-518).

Revision ID: 0004
Revises: 0003
Create Date: 2026-10-21 02:40:00.000000
"""

from typing import Sequence, Union
from alembic import op

revision: str = "0004"
down_revision: Union[str, Sequence[str], None] = "0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_notifications_identity_unread_created "
        "ON notifications (identity_id, is_read, created_at DESC)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_cv_review_orders_candidate_created "
        "ON cv_review_orders (candidate_identity_id, created_at DESC)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_cv_review_orders_status_created "
        "ON cv_review_orders (order_status, created_at DESC)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_job_tracker_candidate_created "
        "ON candidate_job_applications_tracker (candidate_identity_id, created_at DESC)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_resume_jd_matches_candidate_created "
        "ON resume_jd_matches (candidate_identity_id, created_at DESC)"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS idx_resume_jd_matches_candidate_created")
    op.execute("DROP INDEX IF EXISTS idx_job_tracker_candidate_created")
    op.execute("DROP INDEX IF EXISTS idx_cv_review_orders_status_created")
    op.execute("DROP INDEX IF EXISTS idx_cv_review_orders_candidate_created")
    op.execute("DROP INDEX IF EXISTS idx_notifications_identity_unread_created")
