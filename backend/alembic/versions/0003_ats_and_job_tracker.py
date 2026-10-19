"""Add Domain 10 ATS Diagnostics & Domain 11 Job Application Tracker tables.

Revision ID: 0003
Revises: 0002
Create Date: 2026-10-14 02:23:00.000000
"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

revision: str = "0003"
down_revision: Union[str, Sequence[str], None] = "0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "job_descriptions",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("company_name", sa.String(255), nullable=True),
        sa.Column("job_title", sa.String(255), nullable=False),
        sa.Column("raw_text", sa.Text(), nullable=False),
        sa.Column("skills_extracted", JSONB, nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        "resume_jd_matches",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("candidate_identity_id", UUID(as_uuid=True), sa.ForeignKey("identities.id", ondelete="CASCADE"), nullable=True),
        sa.Column("job_description_id", UUID(as_uuid=True), sa.ForeignKey("job_descriptions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("ats_score", sa.Integer(), nullable=False),
        sa.Column("matched_skills", JSONB, nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("missing_skills", JSONB, nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("star_analysis", JSONB, nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("parse_warnings", JSONB, nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        "candidate_job_applications_tracker",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("candidate_identity_id", UUID(as_uuid=True), sa.ForeignKey("identities.id", ondelete="CASCADE"), nullable=True),
        sa.Column("company_name", sa.String(255), nullable=False),
        sa.Column("position_title", sa.String(255), nullable=False),
        sa.Column("status", sa.String(50), nullable=False, server_default="TARGETING"),
        sa.Column("expected_salary", sa.String(100), nullable=True),
        sa.Column("match_score", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("interview_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("candidate_job_applications_tracker")
    op.drop_table("resume_jd_matches")
    op.drop_table("job_descriptions")
