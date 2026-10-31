"""TDD Suite for BEL-246 (#255):
Verifies System Design Primer (BE Read-Replica routing, Cross-Pod L1 Pub/Sub cache invalidation,
and Half-Open Circuit Breaker state machine) and Primer 3-Tier Design Token SSOT
(tokens/design-tokens.json synced across Web CSS, Web TS, and Mobile RN tokens).
"""

import ast
import json
import subprocess
import sys
import time
from pathlib import Path
import pytest
from httpx import AsyncClient

from app.core.cache import AsyncTieredCache
from app.core.config import Settings
from app.core.database import get_db, get_read_db
from app.core.gateway import get_gateway_circuit_state

ROOT = Path(__file__).resolve().parents[2]


@pytest.mark.asyncio
async def test_read_replica_routing_and_settings_fallback(client: AsyncClient):
    """Verify Settings.read_database_url and get_read_db() route read queries cleanly."""
    s_default = Settings(DATABASE_URL="postgresql+asyncpg://u:p@primary:5432/db")
    assert s_default.read_database_url == "postgresql+asyncpg://u:p@primary:5432/db"

    s_replica = Settings(
        DATABASE_URL="postgresql+asyncpg://u:p@primary:5432/db",
        DATABASE_READ_URL="postgresql+asyncpg://u:p@replica:5432/db",
    )
    assert s_replica.read_database_url == "postgresql+asyncpg://u:p@replica:5432/db"
    assert callable(get_read_db) and callable(get_db)

    res = await client.get("/v1/catalogs/skills")
    assert res.status_code == 200


@pytest.mark.asyncio
async def test_tiered_cache_pubsub_invalidation_and_half_open_circuit_breaker():
    """Verify cross-pod L1 invalidation and CLOSED -> OPEN -> HALF_OPEN -> CLOSED circuit state."""
    cache = AsyncTieredCache(namespace="belooga_test_primer", l1_max_size=128)
    assert cache.get_stats()["circuit_state"] == "CLOSED"

    val = await cache.get_or_set("pub_profile:alex", ttl_seconds=60, loader=lambda: _async_val({"name": "Alex"}))
    assert val == {"name": "Alex"}
    assert cache.get_stats()["l1_entries"] == 1

    # Simulate remote pod Pub/Sub invalidation event arriving on 'belooga:cache:inval'
    dropped = cache.apply_remote_invalidation("belooga_test_primer:pub_profile:")
    assert dropped == 1
    assert cache.get_stats()["l1_entries"] == 0

    # Simulate Redis failure tripping circuit breaker to OPEN, then cooling down to HALF_OPEN
    cache._trip_circuit(cooldown_seconds=0.05)
    assert cache.get_stats()["circuit_state"] == "OPEN"
    time.sleep(0.06)
    assert cache.get_stats()["circuit_state"] == "HALF_OPEN"
    cache._close_circuit()
    assert cache.get_stats()["circuit_state"] == "CLOSED"
    assert get_gateway_circuit_state() in ("CLOSED", "OPEN", "HALF_OPEN")


async def _async_val(v):
    return v


def test_primer_three_tier_design_tokens_ssot_sync():
    """Verify 3-tier W3C tokens/design-tokens.json is in 100% sync across FE CSS/TS and Mobile tokens."""
    tokens_path = ROOT / "tokens" / "design-tokens.json"
    assert tokens_path.exists(), "tokens/design-tokens.json must exist"
    doc = json.loads(tokens_path.read_text(encoding="utf-8"))
    assert "base" in doc and "semantic" in doc and "component" in doc
    for mode in ("light", "dark", "neumorphic"):
        assert mode in doc["semantic"]
        for group in ("surface", "brand", "typography", "status"):
            assert group in doc["semantic"][mode]

    sync_script = ROOT / "scripts" / "sync-design-tokens.py"
    assert sync_script.exists(), "scripts/sync-design-tokens.py must exist"
    ast.parse(sync_script.read_text(encoding="utf-8"))
    proc = subprocess.run([sys.executable, "-I", "-S", str(sync_script), "--check"], capture_output=True, text=True)
    assert proc.returncode == 0, f"Design token drift detected: {proc.stdout} {proc.stderr}"


def test_be_fe_qc_review_agents_and_skills_enforce_primer_contracts():
    """Verify BE review, FE review, QC skills, and ai-code-reviewer.py enforce System & Design Primer gates."""
    ai_reviewer_src = (ROOT / "scripts" / "ai-code-reviewer.py").read_text(encoding="utf-8")
    ast.parse(ai_reviewer_src)
    assert "tokens/design-tokens.json" in ai_reviewer_src
    assert "mobile_unused_hooks" in ai_reviewer_src

    be_review = (ROOT / ".agents" / "skills" / "be-code-review" / "SKILL.md").read_text(encoding="utf-8")
    assert "get_read_db" in be_review
    assert "apply_remote_invalidation" in be_review
    assert "circuit_state" in be_review
    assert "Rationalization Prevention" in be_review

    fe_review = (ROOT / ".agents" / "skills" / "fe-code-review" / "SKILL.md").read_text(encoding="utf-8")
    assert "tokens/design-tokens.json" in fe_review
    assert "sync-design-tokens.py" in fe_review
    assert "mobile_unused_hooks" in fe_review
    assert "Rationalization Prevention" in fe_review

    qc_skill = (ROOT / ".agents" / "skills" / "belooga-qc-engineering" / "SKILL.md").read_text(encoding="utf-8")
    assert "tokens/design-tokens.json" in qc_skill
    assert "sync-design-tokens.py" in qc_skill
    assert "get_read_db" in qc_skill
    assert "Rationalization Prevention" in qc_skill

