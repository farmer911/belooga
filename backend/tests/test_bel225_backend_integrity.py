"""BEL-225 (#195): Integration & Security Tests for Backend Audit Remediation (#5, #6, #7, #8, #9, #14)."""

import ast
from pathlib import Path
import pytest
from httpx import AsyncClient

from app.models.base import Base
from app.modules.catalogs import service as catalogs_service_mod


@pytest.mark.asyncio
async def test_bel225_item5_fe_and_mobile_growth_and_wallet_routes_parity(client: AsyncClient):
    """Item #5: Every route called by Web FE & Mobile App must exist and persist in PostgreSQL."""
    # 1. GET /v1/growth/referrals
    r_ref = await client.get("/v1/growth/referrals")
    assert r_ref.status_code == 200
    referrals = r_ref.json()
    assert isinstance(referrals, list) and len(referrals) >= 2
    assert "company_name" in referrals[0]
    assert "bonus_vnd" in referrals[0]

    # 2. GET /v1/growth/cv-roasts + POST /v1/growth/cv-roasts + POST /v1/growth/cv-roasts/{id}/vote
    r_roasts = await client.get("/v1/growth/cv-roasts")
    assert r_roasts.status_code == 200
    initial_roasts = r_roasts.json()
    assert isinstance(initial_roasts, list) and len(initial_roasts) >= 1

    r_create_roast = await client.post(
        "/v1/growth/cv-roasts",
        json={"summary": "Senior Golang Engineer 25k RPS, P99 18ms, PostgreSQL 16 GIN."},
    )
    assert r_create_roast.status_code == 200
    created_roast = r_create_roast.json()
    roast_id = created_roast["id"]
    initial_votes = created_roast["votes"]

    r_vote = await client.post(f"/v1/growth/cv-roasts/{roast_id}/vote")
    assert r_vote.status_code == 200
    voted_roast = r_vote.json()
    assert voted_roast["votes"] == initial_votes + 1

    # 3. GET /v1/growth/expert-mock-slots
    r_slots = await client.get("/v1/growth/expert-mock-slots")
    assert r_slots.status_code == 200
    slots = r_slots.json()
    assert isinstance(slots, list) and len(slots) >= 2
    assert "expert_name" in slots[0] and "price_vnd" in slots[0]

    # 4. GET /v1/recruiter/reverse-bids + POST /v1/recruiter/reverse-bids
    r_bids = await client.get("/v1/recruiter/reverse-bids")
    assert r_bids.status_code == 200
    bids = r_bids.json()
    assert isinstance(bids, list) and len(bids) >= 1

    r_post_bid = await client.post(
        "/v1/recruiter/reverse-bids",
        json={"username": "alexnguyen", "role": "Principal Go Architect", "salary_usd": 4500},
    )
    assert r_post_bid.status_code == 200
    new_bid = r_post_bid.json()
    assert new_bid["username"] == "alexnguyen"
    assert new_bid["salary_usd"] == 4500

    # 5. GET /v1/growth/rewards
    r_rewards = await client.get("/v1/growth/rewards")
    assert r_rewards.status_code == 200
    rewards = r_rewards.json()
    assert isinstance(rewards, list) and len(rewards) >= 2
    assert "bonus_vnd" in rewards[0]

    # 6. GET /v1/wallet/balance (Mobile Wallet screen parity)
    r_wallet = await client.get("/v1/wallet/balance")
    assert r_wallet.status_code == 200
    wallet_data = r_wallet.json()
    assert "available_balance_vnd" in wallet_data
    assert "escrow_locked_vnd" in wallet_data


@pytest.mark.asyncio
async def test_bel225_item6_catalogs_served_from_postgresql_without_memory_concatenation(client: AsyncClient):
    """Item #6: CatalogsService must query PostgreSQL catalog tables without in-memory fallback array concatenation."""
    assert not hasattr(catalogs_service_mod, "COMPANIES_CATALOG")
    assert not hasattr(catalogs_service_mod, "SCHOOLS_CATALOG")
    assert not hasattr(catalogs_service_mod, "LOCATIONS_CATALOG")

    r_comp = await client.get("/v1/profile/company/", params={"name": "Stripe"})
    assert r_comp.status_code == 200
    assert any("Stripe" in c["name"] for c in r_comp.json())

    r_sch = await client.get("/v1/profile/school/", params={"name": "MIT"})
    assert r_sch.status_code == 200
    assert any("MIT" in s["name"] for s in r_sch.json())


@pytest.mark.asyncio
async def test_bel225_item7_dynamic_cv_auto_import_parsing(client: AsyncClient):
    """Item #7: CV Auto-Import dynamically parses candidate name, headline, and skills from raw_cv_text."""
    cv_raw = (
        "Trần Minh Quân\n"
        "Staff Cloud Native & Rust Architect\n"
        "- Architected Rust, Kubernetes, PostgreSQL, and Kafka pipelines handling 80,000 RPS.\n"
        "- Built distributed tracing with Golang and Docker across 12 microservices.\n"
    )
    resp = await client.post("/v1/growth/cv-auto-import", json={"raw_cv_text": cv_raw})
    assert resp.status_code == 200
    data = resp.json()
    assert data["full_name"] == "Trần Minh Quân"
    assert "Rust" in data["headline"]
    assert "Rust" in data["extracted_skills"]
    assert "Kubernetes" in data["extracted_skills"]


@pytest.mark.asyncio
async def test_bel225_item9_production_hmac_guard_rejects_mock_signatures(client: AsyncClient, monkeypatch):
    """Item #9: In production environment, mock MoMo IPN signatures are strictly rejected."""
    monkeypatch.setenv("ENVIRONMENT", "production")
    monkeypatch.setenv("MOMO_SECRET_KEY", "prod_live_hmac_secret_key_999")
    resp = await client.post(
        "/v1/payments/momo/ipn",
        json={
            "order_id": "MOMO-TEST-123",
            "amount": 49000,
            "trans_id": "TRANS-999",
            "result_code": 0,
            "signature": "mock_signature_valid",
        },
    )
    assert resp.status_code == 400


def test_bel225_item14_alembic_0006_full_schema_sync_coverage():
    """Item #14: Alembic migration 0006 exists and all SQLAlchemy Base.metadata tables are covered in migrations."""
    versions_dir = Path(__file__).resolve().parent.parent / "alembic" / "versions"
    mig_0006 = versions_dir / "0006_full_platform_schema_sync.py"
    assert mig_0006.exists(), "0006_full_platform_schema_sync.py must exist"

    tree = ast.parse(mig_0006.read_text(encoding="utf-8"))
    func_names = {n.name for n in tree.body if isinstance(n, ast.FunctionDef)}
    assert {"upgrade", "downgrade"}.issubset(func_names)

    all_mig_sql = "\n".join(p.read_text(encoding="utf-8") for p in versions_dir.glob("*.py"))
    for table_name in Base.metadata.tables.keys():
        assert table_name in all_mig_sql, f"Table '{table_name}' missing from Alembic migrations!"
