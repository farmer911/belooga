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
sys.stdout.reconfigure(encoding="utf-8")  # Windows pipes default to cp1252
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
    return sum(len(rx.findall(p.read_text(encoding="utf-8", errors="ignore"))) for p in paths)


fe_src = files(FE, {".ts", ".tsx"}) + files(MOBILE_SRC, {".ts", ".tsx"}) + files(MOBILE_APP, {".ts", ".tsx"})
fe_prod_src = [p for p in fe_src if "__tests__" not in p.parts]
be_src = files(BE, {".py"})
pages = [p for p in fe_src if p.name == "page.tsx"]


def count_empty_catches(txt: str) -> int:
    hits = txt.replace(" ", "").replace("\n", "").count(".catch(()=>{})")
    idx = 0
    n = len(txt)
    while True:
        pos = txt.find("catch", idx)
        if pos == -1:
            break
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
        cleaned_lines = []
        for line in inner.splitlines():
            s = line.split("//", 1)[0].strip()
            if s.startswith("/*") and s.endswith("*/"):
                s = ""
            if s:
                cleaned_lines.append(s)
        if not cleaned_lines:
            hits += 1
    return hits


fe_comp_files = [p for p in (FE / "components").rglob("*") if p.suffix in (".ts", ".tsx")] if (FE / "components").exists() else []
fe_non_test_files = [p for p in files(FE, {".ts", ".tsx"}) if "__tests__" not in p.parts]
orphan_comp_count = 0
for cf in fe_comp_files:
    other_blob = "\n".join(p.read_text(encoding="utf-8", errors="ignore") for p in fe_non_test_files if p != cf)
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
    for m in re.finditer(r'__tablename__\s*=\s*["\']([^"\']+)["\']', p.read_text(encoding="utf-8", errors="ignore"))
}
alembic_blob = "\n".join(p.read_text(encoding="utf-8", errors="ignore") for p in files(ROOT / "backend" / "alembic" / "versions", {".py"}))
alembic_drift_count = sum(1 for t in models_tables if t not in alembic_blob)


def alembic_graph_errors(versions_dir: Path) -> list:
    """Hard gate (not ratcheted): parse revision/down_revision; fail on duplicate ids or != 1 head."""
    import ast

    revs, downs, errors = {}, set(), []
    for p in sorted(versions_dir.glob("*.py")):
        vals = {}
        for node in ast.parse(p.read_text(encoding="utf-8")).body:
            target = node.target if isinstance(node, ast.AnnAssign) else (node.targets[0] if isinstance(node, ast.Assign) else None)
            if isinstance(target, ast.Name) and target.id in ("revision", "down_revision") and node.value is not None:
                vals[target.id] = ast.literal_eval(node.value)
        rev = vals.get("revision")
        if rev is None:
            continue
        if rev in revs:
            errors.append(f"  FAIL   alembic duplicate revision {rev!r}: {revs[rev]} and {p.name}")
        revs[rev] = p.name
        down = vals.get("down_revision")
        downs.update(down if isinstance(down, (list, tuple)) else [down] if down else [])
    heads = sorted(set(revs) - downs)
    if revs and len(heads) != 1:
        errors.append(f"  FAIL   alembic must have exactly 1 head, found {len(heads)}: {heads}")
    return errors


graph_errors = alembic_graph_errors(ROOT / "backend" / "alembic" / "versions")

current = {
    "fe_arbitrary_hex": count(r"\[#[0-9a-fA-F]{3,8}\]", fe_src),
    "fe_structural_emoji": count(r"[\U0001F300-\U0001FAFF\u2600-\u26FF]", fe_src),
    "fe_any": count(r":\s*any\b|\bas any\b|<any>", fe_src),
    "fe_ts_ignore": count(r"@ts-ignore|@ts-expect-error", fe_src),
    "fe_mock_fallback_arrays": count(MOCK_FALLBACK_PAT, fe_src),
    "fe_silent_catch_mutation": count(SILENT_CATCH_MUTATION_PAT, fe_src),
    "fe_empty_catch_blocks": sum(count_empty_catches(p.read_text(encoding="utf-8", errors="ignore")) for p in fe_prod_src),
    "fe_blind_unknown_casts": count(r"\bas\s+unknown\s+as\b", fe_prod_src),
    "fe_eslint_disable": count(r"eslint-disable", fe_prod_src),
    "fe_orphan_components": orphan_comp_count,
    "be_anonymous_alexnguyen_fallback": count(
        r"\balexnguyen\b",
        [BE / "modules" / "cms" / "service.py", BE / "schemas" / "cms.py"],
    ),
    "mobile_android_http_calls": count(r"\bHttpURLConnection\b", files(ROOT / "mobile" / "android", {".java"})),
    "alembic_schema_drift": alembic_drift_count,
    "fe_max_page_lines": max((len(p.read_text(encoding="utf-8").splitlines()) for p in pages), default=0),
    "fe_files_over_300_lines": sum(1 for p in fe_src if len(p.read_text(encoding="utf-8").splitlines()) > 300),
    "be_files_over_300_lines": sum(1 for p in be_src if len(p.read_text(encoding="utf-8").splitlines()) > 300),
    "be_type_ignore": count(r"#\s*type:\s*ignore", be_src),
    "be_sql_in_routers": count(r"\b(text|select)\(|\b(db|session)\.execute\(", list((BE / "api").rglob("*.py"))),
    "be_routes_without_response_model": sum(
        1 for p in (BE / "api").rglob("*.py")
        for line in p.read_text(encoding="utf-8").splitlines()
        if re.match(r"\s*@router\.(get|post|put|patch|delete)\(", line) and "response_model" not in line
    ),
}

if "--update" in sys.argv or not BASELINE.exists():
    BASELINE.write_text(json.dumps(current, indent=2) + "\n", encoding="utf-8")
    print(f"Baseline written to {BASELINE.relative_to(ROOT)}")
    print(json.dumps(current, indent=2))
    sys.exit(0)

base = json.loads(BASELINE.read_text(encoding="utf-8"))
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

print("\n".join(graph_errors + worse + better) or "  no change")
sys.exit(1 if worse or graph_errors else 0)
