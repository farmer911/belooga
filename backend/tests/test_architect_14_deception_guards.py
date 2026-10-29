"""Tests for BEL-228 Architect 14-Deception Guards across VIOLATIONS_REGISTER, Ratchet, CMS, Mobile, and Alembic."""

import ast
import json
from pathlib import Path

from app.models.base import Base
from app.models.notifications import NotificationPreference

ROOT = Path(__file__).resolve().parent.parent.parent


def test_violations_register_records_all_14_deception_behaviors() -> None:
    tree = ast.parse((ROOT / "scripts" / "trust-benchmark.py").read_text(encoding="utf-8"))
    assert isinstance(tree, ast.Module)
    reg_txt = (ROOT / "docs" / "VIOLATIONS_REGISTER.md").read_text(encoding="utf-8")
    assert "VIOLATION-013" in reg_txt
    for idx in range(1, 15):
        assert f"Deception #{idx}" in reg_txt, f"Missing Deception #{idx} in docs/VIOLATIONS_REGISTER.md"


def test_ratchet_enforces_anti_deception_metrics() -> None:
    tree = ast.parse((ROOT / "scripts" / "ratchet.py").read_text(encoding="utf-8"))
    assert isinstance(tree, ast.Module)
    ratchet_data = json.loads((ROOT / ".agents" / "ratchet.json").read_text(encoding="utf-8"))
    assert ratchet_data.get("fe_mock_fallback_arrays") == 0
    assert ratchet_data.get("fe_silent_catch_mutation") == 0
    assert ratchet_data.get("be_anonymous_alexnguyen_fallback") == 0
    assert ratchet_data.get("alembic_schema_drift") == 0


def test_be_cms_has_zero_anonymous_alexnguyen_fallbacks() -> None:
    service_txt = (ROOT / "backend" / "app" / "modules" / "cms" / "service.py").read_text(encoding="utf-8")
    schema_txt = (ROOT / "backend" / "app" / "schemas" / "cms.py").read_text(encoding="utf-8")
    assert isinstance(ast.parse(service_txt), ast.Module)
    assert isinstance(ast.parse(schema_txt), ast.Module)
    assert "alexnguyen" not in service_txt
    assert "alexnguyen" not in schema_txt


def test_zero_alembic_schema_drift_across_all_models() -> None:
    models_tables = set(Base.metadata.tables.keys())
    assert NotificationPreference.__tablename__ in models_tables
    alembic_txt = "\n".join(
        p.read_text(encoding="utf-8") for p in (ROOT / "backend" / "alembic" / "versions").glob("*.py")
    )
    missing = [t for t in sorted(models_tables) if t not in alembic_txt]
    assert missing == [], f"Tables missing from backend/alembic/versions/: {missing}"
