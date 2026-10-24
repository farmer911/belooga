#!/usr/bin/env python3
"""
ratchet.py — Quality metrics that may only improve.

Replaces "zero X or REJECT" rules that the current code cannot meet. CI fails when a
metric gets WORSE than the recorded baseline; when it gets better, run with --update
to lock in the new, lower baseline.

Usage:
    python3 scripts/ratchet.py            # compare against .agents/ratchet.json
    python3 scripts/ratchet.py --update   # rewrite baseline with current values
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BASELINE = ROOT / ".agents" / "ratchet.json"
FE = ROOT / "frontend" / "src"
MOBILE_SRC = ROOT / "mobile" / "src"
MOBILE_APP = ROOT / "mobile" / "app"
BE = ROOT / "backend" / "app"


def files(base, exts):
    if not base.exists():
        return []
    return [p for p in base.rglob("*") if p.suffix in exts and "node_modules" not in p.parts]


def count(pattern, paths):
    rx = re.compile(pattern)
    return sum(len(rx.findall(p.read_text(errors="ignore"))) for p in paths)


fe_src = files(FE, {".ts", ".tsx"}) + files(MOBILE_SRC, {".ts", ".tsx"}) + files(MOBILE_APP, {".ts", ".tsx"})
fe_prod_src = [p for p in fe_src if "__tests__" not in p.parts]
be_src = files(BE, {".py"})
pages = [p for p in fe_src if p.name == "page.tsx"]

EMPTY_CATCH_PAT = (
    r"catch\s*(?:\([^)]*\))?\s*\{\s*(?://[^\n]*\s*|/\*.*?\*/\s*)*\}"
    r"|\.catch\(\s*\(\)\s*=>\s*\{\s*\}\s*\)"
)
fe_comp_files = [p for p in (FE / "components").rglob("*") if p.suffix in (".ts", ".tsx")] if (FE / "components").exists() else []
fe_non_test_files = [p for p in files(FE, {".ts", ".tsx"}) if "__tests__" not in p.parts]
orphan_comp_count = 0
for cf in fe_comp_files:
    other_blob = "\n".join(p.read_text(errors="ignore") for p in fe_non_test_files if p != cf)
    if cf.stem not in other_blob:
        orphan_comp_count += 1

MOCK_FALLBACK_PAT = (
    r"\b(?:FALLBACK_POSTS|FALLBACK_CAREER_JOBS|FALLBACK_CANDIDATE_ANALYTICS"
    r"|FALLBACK_RECRUITER_ANALYTICS|FALLBACK_EXPERT_ANALYTICS|FALLBACK_EXECUTIVE_BI_ANALYTICS"
    r"|FALLBACK_MARKET_JOBS|INITIAL_RECRUITER_PIPELINE|DEFAULT_USER_POSTS"
    r"|DEFAULT_RANKED_EXPERTS|DEFAULT_TOP_CANDIDATES|DEFAULT_REFERRALS"
    r"|DEFAULT_QUESTIONS|DEFAULT_ROADMAP)\b"
    r"|//\s*Fallback to local"
)

SILENT_CATCH_MUTATION_PAT = (
    r"//\s*Optimistic social feed fallback"
    r"|catch\s*(?:\([^)]*\))?\s*\{[^}]*?\b(?:setSubmitted|setIsSuccess|setIsSaved)\s*\(\s*true\s*\)"
)

models_tables = {
    m.group(1)
    for p in files(BE / "models", {".py"})
    for m in re.finditer(r'__tablename__\s*=\s*["\']([^"\']+)["\']', p.read_text(errors="ignore"))
}
alembic_blob = "\n".join(p.read_text(errors="ignore") for p in files(ROOT / "backend" / "alembic" / "versions", {".py"}))
alembic_drift_count = sum(1 for t in models_tables if t not in alembic_blob)

current = {
    "fe_arbitrary_hex": count(r"\[#[0-9a-fA-F]{3,8}\]", fe_src),
    "fe_structural_emoji": count(r"[\U0001F300-\U0001FAFF\u2600-\u26FF]", fe_src),
    "fe_any": count(r":\s*any\b|\bas any\b|<any>", fe_src),
    "fe_ts_ignore": count(r"@ts-ignore|@ts-expect-error", fe_src),
    "fe_mock_fallback_arrays": count(MOCK_FALLBACK_PAT, fe_src),
    "fe_silent_catch_mutation": count(SILENT_CATCH_MUTATION_PAT, fe_src),
    "fe_empty_catch_blocks": sum(
        len(re.findall(EMPTY_CATCH_PAT, p.read_text(errors="ignore"), re.DOTALL)) for p in fe_prod_src
    ),
    "fe_blind_unknown_casts": count(r"\bas\s+unknown\s+as\b", fe_prod_src),
    "fe_eslint_disable": count(r"eslint-disable", fe_prod_src),
    "fe_orphan_components": orphan_comp_count,
    "be_anonymous_alexnguyen_fallback": count(
        r"\balexnguyen\b",
        [BE / "modules" / "cms" / "service.py", BE / "schemas" / "cms.py"],
    ),
    "mobile_android_http_calls": count(r"\bHttpURLConnection\b", files(ROOT / "mobile" / "android", {".java"})),
    "alembic_schema_drift": alembic_drift_count,
    "fe_max_page_lines": max((len(p.read_text().splitlines()) for p in pages), default=0),
    "fe_files_over_300_lines": sum(1 for p in fe_src if len(p.read_text().splitlines()) > 300),
    "be_files_over_300_lines": sum(1 for p in be_src if len(p.read_text().splitlines()) > 300),
    "be_type_ignore": count(r"#\s*type:\s*ignore", be_src),
    "be_sql_in_routers": count(r"\b(text|select)\(|\b(db|session)\.execute\(", list((BE / "api").rglob("*.py"))),
    "be_routes_without_response_model": sum(
        1 for p in (BE / "api").rglob("*.py")
        for line in p.read_text().splitlines()
        if re.match(r"\s*@router\.(get|post|put|patch|delete)\(", line) and "response_model" not in line
    ),
}

if "--update" in sys.argv or not BASELINE.exists():
    BASELINE.write_text(json.dumps(current, indent=2) + "\n")
    print(f"Baseline written to {BASELINE.relative_to(ROOT)}")
    print(json.dumps(current, indent=2))
    sys.exit(0)

base = json.loads(BASELINE.read_text())
MIN_METRICS = {"mobile_android_http_calls"}
worse, better = [], []
for k, v in current.items():
    b = base.get(k)
    if b is None:
        continue
    if k in MIN_METRICS:
        if v < b:
            worse.append(f"  WORSE  {k}: {b} -> {v} (must be >= {b})")
        elif v > b:
            better.append(f"  better {k}: {b} -> {v}  (run --update to lock in)")
    else:
        if v > b:
            worse.append(f"  WORSE  {k}: {b} -> {v}")
        elif v < b:
            better.append(f"  better {k}: {b} -> {v}  (run --update to lock in)")

print("\n".join(worse + better) or "  no change")
sys.exit(1 if worse else 0)
