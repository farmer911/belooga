"""Baseline initial schema reflecting all 24 tables from backend/initdb.sql.

Revision ID: 0001
Revises:
Create Date: 2026-10-04 18:00:00.000000
"""

from pathlib import Path
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "0001"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

INITDB_PATH = Path(__file__).resolve().parent.parent.parent / "initdb.sql"

TABLES_IN_REVERSE_ORDER = [
    "career_applications",
    "career_postings",
    "profile_reports",
    "contact_inquiries",
    "video_archives",
    "catalog_locations",
    "catalog_schools",
    "catalog_companies",
    "profile_interests",
    "interests",
    "profile_languages",
    "languages",
    "profile_skills",
    "skills",
    "award_certifications",
    "education_experiences",
    "job_experiences",
    "profile_media",
    "candidate_profiles",
    "email_verification_tokens",
    "password_reset_tokens",
    "social_accounts",
    "refresh_sessions",
    "identities",
]


def upgrade() -> None:
    """Execute baseline initial schema DDL for all 24 tables."""
    if not INITDB_PATH.exists():
        raise FileNotFoundError(f"Initial schema file not found at {INITDB_PATH}")

    sql_statements = INITDB_PATH.read_text(encoding="utf-8")
    op.execute(sa.text(sql_statements))


def downgrade() -> None:
    """Drop all 24 baseline tables in reverse dependency order."""
    for table_name in TABLES_IN_REVERSE_ORDER:
        op.execute(sa.text(f"DROP TABLE IF EXISTS {table_name} CASCADE"))
