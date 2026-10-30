"""Alembic chain must be linear and `upgrade head` on an empty database must produce every ORM table."""

import asyncio
import os
from pathlib import Path
import subprocess
import sys
import uuid

import asyncpg
from alembic.config import Config
from alembic.script import ScriptDirectory

from app.models.base import Base
from tests.conftest import TEST_DATABASE_URL

BACKEND = Path(__file__).resolve().parent.parent


def test_alembic_has_single_head_and_unique_revisions():
    script = ScriptDirectory.from_config(Config(str(BACKEND / "alembic.ini")))
    revisions = [r.revision for r in script.walk_revisions()]
    assert len(revisions) == len(set(revisions)), f"duplicate revision ids: {revisions}"
    assert len(script.get_heads()) == 1, f"multiple heads: {script.get_heads()}"


def test_upgrade_head_on_empty_database_matches_models():
    admin_dsn = TEST_DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")
    db_name = f"belooga_migrate_{uuid.uuid4().hex[:8]}"
    base_dsn = admin_dsn.rsplit("/", 1)[0]

    async def admin(sql: str) -> None:
        conn = await asyncpg.connect(admin_dsn)
        try:
            await conn.execute(sql)
        finally:
            await conn.close()

    async def tables() -> set[str]:
        conn = await asyncpg.connect(f"{base_dsn}/{db_name}")
        try:
            rows = await conn.fetch("SELECT tablename FROM pg_tables WHERE schemaname = 'public'")
            return {r["tablename"] for r in rows}
        finally:
            await conn.close()

    asyncio.run(admin(f'CREATE DATABASE "{db_name}"'))
    try:
        env = {**os.environ, "DATABASE_URL": f"{base_dsn}/{db_name}".replace("postgresql://", "postgresql+asyncpg://")}
        proc = subprocess.run(
            [sys.executable, "-m", "alembic", "upgrade", "head"],
            cwd=BACKEND, env=env, capture_output=True, text=True, timeout=180,
        )
        assert proc.returncode == 0, proc.stderr[-2000:]
        missing = set(Base.metadata.tables) - asyncio.run(tables())
        assert not missing, f"tables in models but not created by migrations: {sorted(missing)}"
    finally:
        asyncio.run(admin(f'DROP DATABASE IF EXISTS "{db_name}" WITH (FORCE)'))
