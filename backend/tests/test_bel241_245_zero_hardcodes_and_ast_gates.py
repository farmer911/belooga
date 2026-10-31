"""TDD Suite for BEL-241..245 (#249, #250, #251, #252, #253):
Enforces zero hardcoded demo personas/companies/salaries in Backend Schemas & Services,
zero temporary *-partN filenames, zero reward-hacked seed constants in runtime modules,
zero raw MoMo endpoint strings or synthetic catch fallbacks in FE/Mobile,
and 0 unused mobile hooks in ratchet.json.
"""

import ast
import json
import re
from pathlib import Path
import pytest
from httpx import AsyncClient

ROOT = Path(__file__).resolve().parents[2]

BANNED_RUNTIME_CONSTANTS = {
    "CURATED_MARKET_JOBS",
    "DEFAULT_RANKED_EXPERTS",
    "SAMPLE_INTERVIEW_QUESTIONS",
    "DEFAULT_CAREER_JOBS",
    "DEFAULT_COMPANY_SEEDS",
    "DEFAULT_SCHOOL_SEEDS",
    "DEFAULT_LOCATION_SEEDS",
    "SAMPLE_CV_DATA",
    "PRESET_VNG",
    "PRESET_SHOPEE",
}

BANNED_BACKEND_LITERALS = {
    "VNG Corporation",
    "VNG Cloud",
    "Shopee Vietnam",
    "Grab Financial Group",
    "ZaloPay / Zion",
    "phucnguyen",
    "Phúc Nguyễn",
    "NGUYỄN VĂN AN",
    "hidden_jane",
    "alexnguyen",
    "Dr. Trần Minh Quân",
    "52.000.000 VNĐ",
    "55.000.000 VNĐ",
    "65.000.000 VNĐ",
    "2026-10-25 14:00 ICT",
    "Anonymous Senior Go #402",
}


def test_no_temporary_part_filenames_or_banned_seed_constants():
    """Verify no *-partN files or reward-hacked constant arrays exist in runtime code."""
    part_files = []
    for folder in ("backend/app", "frontend/src", "mobile/src", "mobile/app"):
        for p in (ROOT / folder).rglob("*"):
            if p.is_file() and re.search(r"-part\d+\.(py|ts|tsx)$", p.name):
                part_files.append(str(p.relative_to(ROOT)))
    assert part_files == [], f"Temporary *-partN files found: {part_files}"

    found_constants = []
    for folder in ("backend/app/modules", "frontend/src", "mobile/src"):
        for p in (ROOT / folder).rglob("*"):
            if not p.is_file() or p.suffix not in (".py", ".ts", ".tsx"):
                continue
            txt = p.read_text(encoding="utf-8")
            if p.suffix == ".py":
                ast.parse(txt, filename=str(p))
            for cname in BANNED_RUNTIME_CONSTANTS:
                if re.search(rf"\b{cname}\b", txt):
                    found_constants.append(f"{p.relative_to(ROOT)}:{cname}")
    assert found_constants == [], f"Banned runtime seed constants found: {found_constants}"


def test_no_hardcoded_demo_personas_or_company_defaults_in_backend():
    """Verify backend/app/schemas and backend/app/modules contain zero hardcoded demo personas/companies."""
    violations = []
    for folder in ("backend/app/schemas", "backend/app/modules"):
        for p in sorted((ROOT / folder).rglob("*.py")):
            rel = p.relative_to(ROOT)
            tree = ast.parse(p.read_text(encoding="utf-8"), filename=str(rel))
            for node in ast.walk(tree):
                if isinstance(node, ast.Constant) and isinstance(node.value, str):
                    for banned in BANNED_BACKEND_LITERALS:
                        if banned in node.value:
                            violations.append(f"{rel}:{node.lineno} -> {node.value!r}")
    assert violations == [], f"Hardcoded demo personas/companies in backend: {violations}"


def test_no_raw_momo_endpoints_or_synthetic_catch_in_fe_and_mobile():
    """Verify FE & Mobile use centralized endpoint constants and never synthesize tailored CV text in catch."""
    from app.schemas.bookmarks import OutreachGeneratorRequest, ReferralRequestCreate

    req = OutreachGeneratorRequest()
    ref_req = ReferralRequestCreate()
    assert req.company_name == "" and ref_req.company_name == ""
    ast.parse("x = 1")

    ats_hook = (ROOT / "frontend/src/hooks/use-ats-Scan.ts").read_text(encoding="utf-8")
    assert "[AI Tailored Summary" not in ats_hook, "Synthetic catch fallback still in use-ats-Scan.ts"

    raw_endpoint_hits = []
    for rel_path in (
        "frontend/src/components/features/expert-review/review-booking-dialog.tsx",
        "frontend/src/components/features/payments/momo-checkout-dialog.tsx",
        "frontend/src/hooks/use-wallet.ts",
        "mobile/src/hooks/use-mobile-career-tools.ts",
    ):
        txt = (ROOT / rel_path).read_text(encoding="utf-8")
        if "/v1/payments/momo/" in txt:
            raw_endpoint_hits.append(rel_path)
    assert raw_endpoint_hits == [], f"Raw MoMo endpoint strings found: {raw_endpoint_hits}"


def test_ratchet_locks_zero_unused_mobile_hooks():
    """Verify .agents/ratchet.json locks mobile_unused_hooks at 0."""
    ast.parse((ROOT / "scripts/ratchet.py").read_text(encoding="utf-8"))
    ratchet_data = json.loads((ROOT / ".agents/ratchet.json").read_text(encoding="utf-8"))
    assert ratchet_data.get("mobile_unused_hooks") == 0


@pytest.mark.asyncio
async def test_market_pulse_and_expert_analytics_reflect_real_db_without_synthetic_offsets(
    client: AsyncClient, test_admin: dict
):
    """Verify market-pulse and analytics services reflect DB without synthetic offset expressions."""
    ats_src = (ROOT / "backend/app/modules/ats_matching/service.py").read_text(encoding="utf-8")
    ast.parse(ats_src)
    assert "total // 14" not in ats_src and "max(12," not in ats_src

    analytics_src = (ROOT / "backend/app/modules/analytics/service.py").read_text(encoding="utf-8")
    ast.parse(analytics_src)
    assert "13300000" not in analytics_src and "148 +" not in analytics_src and "412 +" not in analytics_src

    res = await client.get("/v1/match/market-pulse")
    assert res.status_code == 200
    body = res.json()
    assert isinstance(body.get("total_jds_analyzed"), int)

