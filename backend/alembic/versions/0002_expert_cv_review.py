"""Add Domain 9 Expert CV Review and Monetization tables.

Revision ID: 0002
Revises: 0001
Create Date: 2026-10-05 10:00:00.000000
"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

# revision identifiers, used by Alembic.
revision: str = "0002"
down_revision: Union[str, Sequence[str], None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. expert_profiles
    op.create_table(
        "expert_profiles",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("identity_id", UUID(as_uuid=True), sa.ForeignKey("identities.id", ondelete="SET NULL"), nullable=True),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("headline", sa.String(255), nullable=False),
        sa.Column("bio", sa.Text(), nullable=False),
        sa.Column("avatar_url", sa.String(512), nullable=True),
        sa.Column("company", sa.String(255), nullable=False),
        sa.Column("role_category", sa.String(100), nullable=False),
        sa.Column("years_of_experience", sa.Integer(), nullable=False, server_default="5"),
        sa.Column("rating", sa.Numeric(3, 2), nullable=False, server_default="5.0"),
        sa.Column("total_reviews_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("turn_around_days", sa.Integer(), nullable=False, server_default="2"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("TRUE")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    # 2. cv_review_packages
    op.create_table(
        "cv_review_packages",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("slug", sa.String(100), unique=True, nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("price_cents", sa.Integer(), nullable=False),
        sa.Column("features", JSONB, nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("turn_around_hours", sa.Integer(), nullable=False, server_default="48"),
        sa.Column("is_popular", sa.Boolean(), nullable=False, server_default=sa.text("FALSE")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    # 3. cv_review_orders
    op.create_table(
        "cv_review_orders",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("candidate_identity_id", UUID(as_uuid=True), sa.ForeignKey("identities.id", ondelete="CASCADE"), nullable=False),
        sa.Column("expert_id", UUID(as_uuid=True), sa.ForeignKey("expert_profiles.id", ondelete="SET NULL"), nullable=True),
        sa.Column("package_id", UUID(as_uuid=True), sa.ForeignKey("cv_review_packages.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("resume_url", sa.String(512), nullable=False),
        sa.Column("target_role", sa.String(255), nullable=False),
        sa.Column("target_companies", sa.String(255), nullable=True),
        sa.Column("candidate_notes", sa.Text(), nullable=True),
        sa.Column("order_status", sa.String(50), nullable=False, server_default="pending_payment"),
        sa.Column("amount_paid_cents", sa.Integer(), nullable=False),
        sa.Column("payment_reference", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    # 4. cv_review_feedbacks
    op.create_table(
        "cv_review_feedbacks",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("order_id", UUID(as_uuid=True), sa.ForeignKey("cv_review_orders.id", ondelete="CASCADE"), unique=True, nullable=False),
        sa.Column("expert_id", UUID(as_uuid=True), sa.ForeignKey("expert_profiles.id", ondelete="CASCADE"), nullable=False),
        sa.Column("score_overall", sa.Integer(), nullable=False),
        sa.Column("score_ats_compatibility", sa.Integer(), nullable=False),
        sa.Column("score_impact_action_verbs", sa.Integer(), nullable=False),
        sa.Column("score_structure_formatting", sa.Integer(), nullable=False),
        sa.Column("summary_verdict", sa.Text(), nullable=False),
        sa.Column("strengths", JSONB, nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("improvements", JSONB, nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("annotated_cv_url", sa.String(512), nullable=True),
        sa.Column("video_feedback_url", sa.String(512), nullable=True),
        sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("cv_review_feedbacks")
    op.drop_table("cv_review_orders")
    op.drop_table("cv_review_packages")
    op.drop_table("expert_profiles")
