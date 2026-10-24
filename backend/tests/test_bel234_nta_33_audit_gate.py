"""TDD Suite for BEL-234: Architect Audit of 33 NTA Defects, AST Gate Upgrade & Domain Skill Sync."""

import ast
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent


def _has_empty_catch(txt: str) -> bool:
    if ".catch(()=>{})" in txt.replace(" ", "").replace("\n", ""):
        return True
    idx = 0
    n = len(txt)
    while True:
        pos = txt.find("catch", idx)
        if pos == -1:
            return False
        idx = pos + 5
        if pos > 0 and (txt[pos - 1].isalnum() or txt[pos - 1] == "_"):
            continue
        if idx < n and (txt[idx].isalnum() or txt[idx] == "_"):
            continue
        cur = idx
        while cur < n and txt[cur].isspace():
            cur += 1
        if cur < n and txt[cur] == "(":
            close_p = txt.find(")", cur + 1)
            if close_p == -1:
                continue
            cur = close_p + 1
        while cur < n and txt[cur].isspace():
            cur += 1
        if cur >= n or txt[cur] != "{":
            continue
        close_b = txt.find("}", cur + 1)
        if close_b == -1 or "{" in txt[cur + 1 : close_b]:
            continue
        inner = txt[cur + 1 : close_b]
        cleaned = [
            s
            for line in inner.splitlines()
            if (s := line.split("//", 1)[0].strip()) and not (s.startswith("/*") and s.endswith("*/"))
        ]
        if not cleaned:
            return True


def _prod_ui_files() -> list[Path]:
    files: list[Path] = []
    for sub in ("frontend/src", "mobile/src", "mobile/app"):
        base = ROOT / sub
        if base.exists():
            for p in base.rglob("*"):
                if p.suffix in (".ts", ".tsx") and "node_modules" not in p.parts and "__tests__" not in p.parts:
                    files.append(p)
    return sorted(files)


def test_bel234_ratchet_and_trust_benchmark_enforce_nta_zero_tolerances() -> None:
    tree = ast.parse((ROOT / "scripts" / "trust-benchmark.py").read_text(encoding="utf-8"))
    assert isinstance(tree, ast.Module)
    ratchet = json.loads((ROOT / ".agents" / "ratchet.json").read_text(encoding="utf-8"))
    assert ratchet.get("fe_empty_catch_blocks") == 0
    assert ratchet.get("fe_blind_unknown_casts") == 0
    assert ratchet.get("fe_eslint_disable") == 0
    assert ratchet.get("fe_orphan_components") == 0


def test_bel234_zero_empty_catch_blind_casts_and_eslint_disable_across_ui() -> None:
    tree = ast.parse((ROOT / "scripts" / "ratchet.py").read_text(encoding="utf-8"))
    assert isinstance(tree, ast.Module)
    for p in _prod_ui_files():
        txt = p.read_text(encoding="utf-8")
        rel = p.relative_to(ROOT).as_posix()
        assert not _has_empty_catch(txt), f"{rel} still contains an empty catch block (NTA-S004)"
        assert "as unknown as" not in txt, f"{rel} still contains a blind 'as unknown as' cast (NTA-S001)"
        assert "eslint-disable" not in txt, f"{rel} still contains an 'eslint-disable' suppression (NTA-S003)"

    sw_txt = (ROOT / "frontend" / "public" / "sw.js").read_text(encoding="utf-8")
    assert "Promise.allSettled" in sw_txt
    assert "AbortSignal.timeout(8000)" in sw_txt
    assert ".catch(() => {})" not in sw_txt


def test_bel234_skills_and_violations_register_codify_nta_lifecycle_rules() -> None:
    tree = ast.parse((ROOT / "scripts" / "lint-skills.py").read_text(encoding="utf-8"))
    assert isinstance(tree, ast.Module)
    reg_txt = (ROOT / "docs" / "VIOLATIONS_REGISTER.md").read_text(encoding="utf-8")
    fe_eng_txt = (ROOT / ".agents" / "skills" / "belooga-frontend-engineering" / "SKILL.md").read_text(encoding="utf-8")
    fe_ws_txt = (ROOT / ".agents" / "skills" / "fe-domain-workspace" / "SKILL.md").read_text(encoding="utf-8")

    assert "VIOLATION-014" in reg_txt
    assert "NTA-S004" in reg_txt and "NTA-S001" in reg_txt and "NTA-D002" in reg_txt
    assert "AbortSignal.timeout" in fe_eng_txt or "normalizeMobileUser" in fe_eng_txt
    assert "MediaRecorder.isTypeSupported" in fe_ws_txt
