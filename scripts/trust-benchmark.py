#!/usr/bin/env python3
"""
trust-benchmark.py — Deterministic Anti-Deception & Anti-Band-Aid Guardrail Benchmark.

Proves empirically that the AI Agent did not:
  1. Fake or skip tests (.skip, assert True, 0-assertion tests)
  2. Swallow exceptions silently (except ...: pass / bare except)
  3. Apply band-aid layer bypasses (SQL in routers, raw fetch() in Next.js page.tsx)
  4. Introduce async event-loop blocking across ANY backend/app/**/*.py file or IDOR gaps
  5. Evade typecheckers or bloat files beyond .agents/ratchet.json baselines
  6. Violate Zero-Sum Memory Caps (.agents/STATE.md <= 50L, .agents/PRODUCT_THESIS.md <= 120L)

Usage:
    python3 scripts/trust-benchmark.py
"""
import ast
import json
import os
import re
import subprocess
import sys
sys.stdout.reconfigure(encoding="utf-8")  # Windows pipes default to cp1252
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BE_APP = ROOT / "backend" / "app"
BE_TESTS = ROOT / "backend" / "tests"
SCRIPTS_DIR = ROOT / "scripts"
FE_SRC = ROOT / "frontend" / "src"
MOBILE_SRC = ROOT / "mobile" / "src"
MOBILE_APP = ROOT / "mobile" / "app"
QC_TESTS = ROOT / "qc" / "tests"
AGENTS = ROOT / ".agents"

BLOCKING_FUNCS = {"open", "remove", "unlink", "rmtree", "copy", "move", "build"}
PUBLIC_MUTATIONS_WHITELIST = {
    "login", "logout", "refresh_tokens", "register_user",
    "request_password_reset", "reset_password", "oauth_callback", "verify_email_token",
    "submit_contact_inquiry", "report_candidate_profile", "apply_career_job",
    "create_momo_payment_qr", "momo_ipn_webhook", "tailor_cv",
}

violations: dict[str, list[str]] = {
    "1. Test Honesty (No Skips/Hollow)": [],
    "2. Error Transparency (No Pass)": [],
    "3. Layer Purity (No Band-Aids)": [],
    "4. Async & IDOR Safety (All BE)": [],
    "5. Ratchet & Size Discipline": [],
    "6. Memory Cap & Skill SSOT": [],
}

# --- 1. TEST HONESTY ---
for p in list(BE_TESTS.rglob("*.py")) + list(QC_TESTS.rglob("*.ts")):
    txt = p.read_text(encoding="utf-8", errors="ignore")
    rel = p.relative_to(ROOT)
    if re.search(r"(\btest\.skip\s*\(|@pytest\.mark\.skip|\bxit\s*\(|\bxdescribe\s*\(|\bassert\s+True\b)", txt):
        violations["1. Test Honesty (No Skips/Hollow)"].append(f"{rel}: contains skip or trivial 'assert True'")
    if p.suffix == ".py" and p.name.startswith("test_"):
        tree = ast.parse(txt, filename=str(rel))
        for n in ast.walk(tree):
            if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef)) and n.name.startswith("test_"):
                src = ast.get_source_segment(txt, n) or ""
                if "assert " not in src and "pytest.raises" not in src:
                    violations["1. Test Honesty (No Skips/Hollow)"].append(f"{rel}:{n.lineno} -> {n.name}() has 0 assertions")
                if (
                    p.name != "test_ui_design_system_parity.py"
                    and ".read_text(" in src
                    and "client." not in src
                    and "await " not in src
                    and "ast.parse(" not in src
                    and "Base.metadata" not in src
                ):
                    violations["1. Test Honesty (No Skips/Hollow)"].append(
                        f"{rel}:{n.lineno} -> {n.name}() is a source-content-only grep test without runtime execution"
                    )

# --- 2. ERROR TRANSPARENCY (NO SILENT SWALLOW) & CLEAN IMPORTS ---
for p in list(BE_APP.rglob("*.py")) + list(SCRIPTS_DIR.rglob("*.py")) + list(BE_TESTS.rglob("*.py")):
    txt = p.read_text(encoding="utf-8")
    rel = p.relative_to(ROOT)
    tree = ast.parse(txt, filename=str(rel))
    for n in ast.walk(tree):
        if isinstance(n, ast.ExceptHandler):
            if n.type is None:
                violations["2. Error Transparency (No Pass)"].append(f"{rel}:{n.lineno} -> bare 'except:' prohibited")
            elif len(n.body) == 1 and isinstance(n.body[0], ast.Pass):
                violations["2. Error Transparency (No Pass)"].append(f"{rel}:{n.lineno} -> silent 'except ...: pass' band-aid")
    if p.name != "__init__.py":
        loaded_names = {n.id for n in ast.walk(tree) if isinstance(n, ast.Name) and isinstance(n.ctx, ast.Load)}
        for n in tree.body:
            if isinstance(n, ast.Assign):
                if any(isinstance(t, ast.Name) and t.id == "__all__" for t in n.targets) and isinstance(n.value, (ast.List, ast.Tuple)):
                    loaded_names.update(elt.value for elt in n.value.elts if isinstance(elt, ast.Constant) and isinstance(elt.value, str))
        for n in tree.body:
            if isinstance(n, (ast.Import, ast.ImportFrom)):
                if isinstance(n, ast.ImportFrom) and n.module == "__future__":
                    continue
                for alias in n.names:
                    if alias.name == "*":
                        continue
                    bound = alias.asname or alias.name.split(".")[0]
                    if bound not in loaded_names:
                        violations["2. Error Transparency (No Pass)"].append(
                            f"{rel}:{n.lineno} -> unused top-level import '{bound}'"
                        )

# --- 3. LAYER PURITY & MODULAR MONOLITH BOUNDARIES ---
for p in (BE_APP / "api" / "v1" / "endpoints").rglob("*.py"):
    txt = p.read_text(encoding="utf-8")
    rel = p.relative_to(ROOT)
    if re.search(r"\b(db\.execute|session\.execute|select\(|text\()\b", txt):
        violations["3. Layer Purity (No Band-Aids)"].append(f"{rel} -> direct DB query inside router (must use Service/Repo)")
    if re.search(r"from\s+app\.(?:repositories|modules\.\w+\.repository)\s+import", txt):
        violations["3. Layer Purity (No Band-Aids)"].append(f"{rel} -> router imports repository directly (must use Module Facade/Service)")
    if re.search(r"from\s+app\.services\.\w+\s+import", txt):
        violations["3. Layer Purity (No Band-Aids)"].append(f"{rel} -> router imports legacy app.services shim (must import from app.modules.<domain>)")

REQUIRED_VERTICAL_MODULES = {
    "profile", "auth", "timeline", "media",
    "catalogs", "search", "cms", "ats_matching",
    "expert_review", "job_tracker", "payments", "analytics",
    "notifications", "bookmarks",
}
MODULES_DIR = BE_APP / "modules"
if MODULES_DIR.exists():
    found_mods = {p.name for p in MODULES_DIR.iterdir() if p.is_dir() and not p.name.startswith("__")}
    for missing_mod in sorted(REQUIRED_VERTICAL_MODULES - found_mods):
        violations["3. Layer Purity (No Band-Aids)"].append(f"backend/app/modules/{missing_mod}/ missing from 12-module vertical architecture")
    for mod_dir in sorted(p for p in MODULES_DIR.iterdir() if p.is_dir() and not p.name.startswith("__")):
        mod_name = mod_dir.name
        for req_f in ("__init__.py", "service.py", "repository.py"):
            if not (mod_dir / req_f).exists():
                violations["3. Layer Purity (No Band-Aids)"].append(f"backend/app/modules/{mod_name}/{req_f} missing in vertical slice")
        repo_f = mod_dir / "repository.py"
        if repo_f.exists() and ".execute(" not in repo_f.read_text(encoding="utf-8"):
            violations["3. Layer Purity (No Band-Aids)"].append(
                f"backend/app/modules/{mod_name}/repository.py must execute real PostgreSQL queries (.execute)"
            )
        for py_f in mod_dir.rglob("*.py"):
            py_txt = py_f.read_text(encoding="utf-8")
            py_rel = py_f.relative_to(ROOT)
            for other_mod in re.findall(r"from\s+app\.modules\.(\w+)\.repository\s+import", py_txt):
                if other_mod != mod_name:
                    violations["3. Layer Purity (No Band-Aids)"].append(
                        f"{py_rel} -> cross-module private repository import from '{other_mod}' (must use app.modules.{other_mod} facade)"
                    )
            if re.search(r"from\s+app\.repositories\.\w+\s+import", py_txt):
                violations["3. Layer Purity (No Band-Aids)"].append(
                    f"{py_rel} -> vertical module imports legacy horizontal app.repositories directly"
                )

ui_files = list(FE_SRC.rglob("*"))
if MOBILE_SRC.exists():
    ui_files.extend(MOBILE_SRC.rglob("*"))
if MOBILE_APP.exists():
    ui_files.extend(MOBILE_APP.rglob("*"))

def has_empty_catch_block(txt: str) -> bool:
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


for p in ui_files:
    if p.suffix not in (".ts", ".tsx"):
        continue
    txt = p.read_text(encoding="utf-8", errors="ignore")
    rel = p.relative_to(ROOT)
    if (p.name == "page.tsx" or "mobile/app/" in rel.as_posix()) and re.search(r"\bfetch\s*\(", txt):
        violations["3. Layer Purity (No Band-Aids)"].append(f"{rel} -> raw fetch() inside route screen (must use hook/service)")
    if re.search(r"useEffect\s*\(\s*\(\)\s*=>\s*\{[^}]*?\b(?:apiClient|mobileApiClient)\.(get|post|put|patch|delete)\b", txt, re.DOTALL):
        violations["3. Layer Purity (No Band-Aids)"].append(f"{rel} -> apiClient called inside useEffect (must use @tanstack/react-query)")
    if re.search(
        r"//\s*Optimistic social feed fallback|catch\s*(?:\([^)]*\))?\s*\{[^}]*?\b(setSubmitted|setIsSuccess|setIsSaved)\s*\(\s*true\s*\)",
        txt,
        re.DOTALL,
    ):
        violations["2. Error Transparency (No Pass)"].append(
            f"{rel} -> fake success state or optimistic fallback inside catch block (fe_silent_catch_mutation == 0)"
        )
    if "__tests__" not in p.parts:
        if has_empty_catch_block(txt):
            violations["2. Error Transparency (No Pass)"].append(
                f"{rel} -> silent empty catch block prohibited (NTA-S004 / fe_empty_catch_blocks == 0)"
            )
        if re.search(r"\bas\s+unknown\s+as\b", txt):
            violations["3. Layer Purity (No Band-Aids)"].append(
                f"{rel} -> blind 'as unknown as' cast prohibited (NTA-S001 / fe_blind_unknown_casts == 0)"
            )
        if "eslint-disable" in txt:
            violations["3. Layer Purity (No Band-Aids)"].append(
                f"{rel} -> eslint-disable suppression prohibited (NTA-S003 / fe_eslint_disable == 0)"
            )
    mock_fallback_hits = re.findall(
        r"\b(?:FALLBACK_POSTS|FALLBACK_CAREER_JOBS|FALLBACK_CANDIDATE_ANALYTICS"
        r"|FALLBACK_RECRUITER_ANALYTICS|FALLBACK_EXPERT_ANALYTICS|FALLBACK_EXECUTIVE_BI_ANALYTICS"
        r"|FALLBACK_MARKET_JOBS|INITIAL_RECRUITER_PIPELINE|DEFAULT_USER_POSTS"
        r"|DEFAULT_RANKED_EXPERTS|DEFAULT_TOP_CANDIDATES|DEFAULT_REFERRALS"
        r"|DEFAULT_QUESTIONS|DEFAULT_ROADMAP)\b|//\s*Fallback to local",
        txt,
    )
    if mock_fallback_hits:
        violations["3. Layer Purity (No Band-Aids)"].append(
            f"{rel} -> prohibited mock/fallback data ({', '.join(sorted(set(mock_fallback_hits)))}) (fe_mock_fallback_arrays == 0)"
        )
    if "frontend/src/" in rel.as_posix():
        for stub_pat, stub_label in (
            (r"\balert\s*\(", "browser alert() stub prohibited"),
            (r"window\.prompt\s*\(", "window.prompt() stub prohibited"),
            (r"Simulated ", "hardcoded 'Simulated ' UI placeholder prohibited"),
            (r"MOMO-MOCK", "fake MOMO-MOCK fallback prohibited"),
        ):
            if re.search(stub_pat, txt):
                violations["3. Layer Purity (No Band-Aids)"].append(f"{rel} -> {stub_label}")

root_layout = FE_SRC / "app" / "layout.tsx"
if root_layout.exists() and "<AuthSessionBootstrap" not in root_layout.read_text(encoding="utf-8"):
    violations["3. Layer Purity (No Band-Aids)"].append(
        "frontend/src/app/layout.tsx missing global <AuthSessionBootstrap /> mount"
    )

fe_prod_ts = [p for p in FE_SRC.rglob("*") if p.suffix in (".ts", ".tsx") and "__tests__" not in p.parts]
for comp_p in sorted((FE_SRC / "components").rglob("*")) if (FE_SRC / "components").exists() else []:
    if comp_p.suffix not in (".ts", ".tsx"):
        continue
    other_txt = "\n".join(p.read_text(encoding="utf-8", errors="ignore") for p in fe_prod_ts if p != comp_p)
    if comp_p.stem not in other_txt:
        violations["3. Layer Purity (No Band-Aids)"].append(
            f"{comp_p.relative_to(ROOT)} -> orphan component not imported anywhere in frontend/src/ (NTA-P003 / fe_orphan_components == 0)"
        )

# Enforce 100% FE-to-BE Endpoint Wiring (Zero Dead/Unintegrated Backend Endpoints)
# Web and mobile clients both count as consumers; provider callbacks are called by third parties, not our UI.
SERVER_TO_SERVER_ROUTES = {"/v1/payments/momo/ipn"}
fe_all_blob = "\n".join(
    p.read_text(encoding="utf-8", errors="ignore")
    for src in (FE_SRC, ROOT / "mobile" / "src", ROOT / "mobile" / "app")
    for p in src.rglob("*")
    if p.suffix in (".ts", ".tsx")
)
for ep_file in sorted((BE_APP / "api" / "v1" / "endpoints").glob("*.py")):
    ep_txt = ep_file.read_text(encoding="utf-8")
    pref_m = re.search(r"APIRouter\(prefix=[\"']([^\"']+)[\"']", ep_txt)
    pref = pref_m.group(1) if pref_m else ""
    for m in re.finditer(r"@router\.(get|post|put|patch|delete)\([\"']([^\"']*)[\"']", ep_txt):
        method, sub = m.group(1).upper(), m.group(2)
        full_path = ("/v1" + pref + sub).replace("//", "/")
        if full_path in SERVER_TO_SERVER_ROUTES:
            continue
        norm_path = re.sub(r"\{[^}]+\}", "{}", full_path).rstrip("/")
        segs = [s for s in norm_path.split("/") if s and s != "{}" and s != "v1"]
        rx = r"/v1/" + r".*?".join(re.escape(s) for s in segs)
        if not re.search(rx, fe_all_blob):
            violations["3. Layer Purity (No Band-Aids)"].append(
                f"{ep_file.relative_to(ROOT)} -> {method} {full_path} is not integrated/called anywhere in frontend/src/ or mobile/"
            )

if not (ROOT / "backend" / "alembic" / "env.py").exists():
    violations["3. Layer Purity (No Band-Aids)"].append("backend/alembic/env.py missing -> Alembic migration environment required")
if not (FE_SRC / "components" / "providers" / "query-provider.tsx").exists():
    violations["3. Layer Purity (No Band-Aids)"].append("query-provider.tsx missing -> @tanstack/react-query provider required")

# Mobile RN + Clean APK Build + E2E Automation Guard (VIOLATION-010)
mobile_pkg_path = ROOT / "mobile" / "package.json"
mobile_build_apk = ROOT / "mobile" / "scripts" / "build-apk.sh"
mobile_e2e_adb = ROOT / "mobile" / "scripts" / "e2e-mobile-adb.sh"
if mobile_pkg_path.exists():
    m_pkg = json.loads(mobile_pkg_path.read_text(encoding="utf-8"))
    m_deps = m_pkg.get("dependencies", {})
    if "react-native" not in m_deps or "expo" not in m_deps:
        violations["3. Layer Purity (No Band-Aids)"].append(
            "mobile/package.json missing real 'react-native' or 'expo' dependencies"
        )
    if not mobile_build_apk.exists():
        violations["3. Layer Purity (No Band-Aids)"].append(
            "mobile/scripts/build-apk.sh missing -> Clean-first APK build pipeline required"
        )
    else:
        apk_txt = mobile_build_apk.read_text(encoding="utf-8")
        if "*.apk" not in apk_txt or "-delete" not in apk_txt or "apksigner" not in apk_txt:
            violations["3. Layer Purity (No Band-Aids)"].append(
                "mobile/scripts/build-apk.sh missing mandatory old-*.apk purge (-delete) or apksigner verify"
            )
    if not mobile_e2e_adb.exists() or not (ROOT / "mobile" / "e2e" / "maestro-flow.yaml").exists():
        violations["1. Test Honesty (No Skips/Hollow)"].append(
            "mobile E2E automation scripts (e2e-mobile-adb.sh / maestro-flow.yaml) missing"
        )

# --- 4. ASYNC EVENT-LOOP & IDOR SAFETY ACROSS ALL BACKEND ---
for p in BE_APP.rglob("*.py"):
    txt = p.read_text(encoding="utf-8")
    rel = p.relative_to(ROOT)
    tree = ast.parse(txt, filename=str(rel))
    for n in ast.walk(tree):
        if isinstance(n, ast.AsyncFunctionDef):
            if n.name.startswith("seed_") and n.name.endswith("_if_empty"):
                fn_src = ast.get_source_segment(txt, n) or ""
                if "pg_advisory_xact_lock" not in fn_src and "ON CONFLICT" not in fn_src.upper():
                    violations["4. Async & IDOR Safety (All BE)"].append(
                        f"{rel}:{n.lineno} -> {n.name}() missing pg_advisory_xact_lock or ON CONFLICT concurrency guard"
                    )
            for sub in ast.walk(n):
                if isinstance(sub, ast.Call):
                    fn = sub.func.id if isinstance(sub.func, ast.Name) else (
                        sub.func.attr if isinstance(sub.func, ast.Attribute) else None
                    )
                    if fn in BLOCKING_FUNCS:
                        violations["4. Async & IDOR Safety (All BE)"].append(
                            f"{rel}:{sub.lineno} -> direct blocking call {fn}() inside async def {n.name}()"
                        )
    if "endpoints" in p.parts:
        for n in ast.walk(tree):
            if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef)):
                is_mut = any(
                    isinstance(d, ast.Call) and isinstance(d.func, ast.Attribute)
                    and d.func.attr.lower() in ("post", "put", "patch", "delete")
                    for d in n.decorator_list
                )
                if is_mut and n.name not in PUBLIC_MUTATIONS_WHITELIST:
                    src = ast.get_source_segment(txt, n) or ""
                    if "get_current_user" not in src and "require_role(" not in src:
                        violations["4. Async & IDOR Safety (All BE)"].append(
                            f"{rel}:{n.lineno} -> mutation {n.name}() missing get_current_user IDOR guard"
                        )

# --- 5. RATCHET & SIZE DISCIPLINE ---
r_proc = subprocess.run([sys.executable, "-I", "-S", str(ROOT / "scripts" / "ratchet.py")], capture_output=True, text=True, encoding="utf-8")
if r_proc.returncode != 0:
    bad = [line.strip() for line in r_proc.stdout.splitlines() if "WORSE" in line or "FAIL" in line]
    violations["5. Ratchet & Size Discipline"].extend(bad or [f"scripts/ratchet.py exited {r_proc.returncode}: {r_proc.stderr.strip()[-200:]}"])

# --- 6. MEMORY CAP & SKILL SSOT ---
state_md = AGENTS / "STATE.md"
thesis_md = AGENTS / "PRODUCT_THESIS.md"
if not state_md.exists() or len(state_md.read_text(encoding="utf-8").splitlines()) > 50:
    violations["6. Memory Cap & Skill SSOT"].append(".agents/STATE.md missing or exceeds 50-line cap")
if not thesis_md.exists() or len(thesis_md.read_text(encoding="utf-8").splitlines()) > 120:
    violations["6. Memory Cap & Skill SSOT"].append(".agents/PRODUCT_THESIS.md missing or exceeds 120-line cap")

l_proc = subprocess.run([sys.executable, "-I", "-S", str(ROOT / "scripts" / "lint-skills.py"), "--quiet"], capture_output=True, text=True, encoding="utf-8")
if l_proc.returncode != 0:
    violations["6. Memory Cap & Skill SSOT"].append("scripts/lint-skills.py reported errors (or failed stdlib -I -S isolation check)")

# Env SSOT Parity & Production Secret Guard
env_example = ROOT / ".env.example"
if not env_example.exists():
    violations["6. Memory Cap & Skill SSOT"].append(".env.example is missing at repository root")
else:
    defined_env_keys = set(re.findall(r"^([A-Z][A-Z0-9_]+)=", env_example.read_text(encoding="utf-8"), re.MULTILINE))
    for p in sorted(BE_APP.rglob("*.py")):
        txt = p.read_text(encoding="utf-8")
        for m in re.finditer(r'os\.getenv\(\s*["\']([A-Z0-9_]+)["\']\s*(?:,\s*([^)]+))?\)', txt):
            env_key, default_arg = m.group(1), m.group(2)
            if env_key not in defined_env_keys:
                violations["6. Memory Cap & Skill SSOT"].append(
                    f"{p.relative_to(ROOT)} -> os.getenv('{env_key}') missing from .env.example"
                )
            if "SECRET" in env_key and default_arg and default_arg.strip() not in ("None", '""', "''"):
                violations["4. Async & IDOR Safety (All BE)"].append(
                    f"{p.relative_to(ROOT)} -> {env_key} has unguarded hardcoded fallback in os.getenv()"
                )
    for p in sorted(list(FE_SRC.rglob("*.ts*")) + (list(MOBILE_SRC.rglob("*.ts*")) if MOBILE_SRC.exists() else [])):
        txt = p.read_text(encoding="utf-8")
        for m in re.finditer(r"process\.env\.((?:NEXT|EXPO)_PUBLIC_[A-Z0-9_]+)", txt):
            fe_key = m.group(1)
            if fe_key not in defined_env_keys:
                violations["6. Memory Cap & Skill SSOT"].append(
                    f"{p.relative_to(ROOT)} -> process.env.{fe_key} missing from .env.example"
                )

if os.getenv("CI") != "true":
    try:
        curr_branch = subprocess.check_output(
            ["git", "rev-parse", "--abbrev-ref", "HEAD"], cwd=str(ROOT), text=True, encoding="utf-8", timeout=5
        ).strip()
        if curr_branch == "main":
            pr_proc = subprocess.run(
                ["gh", "pr", "list", "--state", "open", "--json", "number,title,headRefName,statusCheckRollup"],
                capture_output=True,
                text=True, encoding="utf-8",
                timeout=5,
                cwd=str(ROOT),
            )
            if pr_proc.returncode == 0 and pr_proc.stdout.strip():
                for pr_item in json.loads(pr_proc.stdout):
                    failed_checks = [
                        c.get("name", "check")
                        for c in (pr_item.get("statusCheckRollup") or [])
                        if c.get("conclusion") in ("FAILURE", "TIMED_OUT", "ACTION_REQUIRED")
                    ]
                    if failed_checks:
                        violations["6. Memory Cap & Skill SSOT"].append(
                            f"Open PR #{pr_item['number']} ({pr_item['title']}) has failing CI checks: {', '.join(failed_checks)}"
                        )
            head_sha = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=str(ROOT), text=True, encoding="utf-8", timeout=5).strip()
            run_proc = subprocess.run(
                ["gh", "run", "list", "--branch", "main", "--limit", "10", "--json", "name,status,conclusion,headSha"],
                capture_output=True,
                text=True, encoding="utf-8",
                timeout=5,
                cwd=str(ROOT),
            )
            if run_proc.returncode == 0 and run_proc.stdout.strip():
                for r_item in json.loads(run_proc.stdout):
                    if r_item.get("headSha") == head_sha and r_item.get("status") == "completed" and r_item.get("conclusion") == "failure":
                        violations["6. Memory Cap & Skill SSOT"].append(
                            f"Main branch workflow '{r_item.get('name')}' failed on main ({head_sha[:7]})"
                        )
            alerts_proc = subprocess.run(
                ["gh", "api", "repos/farmer911/belooga/code-scanning/alerts?state=open&per_page=100"],
                capture_output=True,
                text=True, encoding="utf-8",
                timeout=5,
                cwd=str(ROOT),
            )
            if alerts_proc.returncode == 0 and alerts_proc.stdout.strip():
                open_alerts = json.loads(alerts_proc.stdout)
                if isinstance(open_alerts, list) and len(open_alerts) > 0:
                    violations["6. Memory Cap & Skill SSOT"].append(
                        f"GitHub CodeQL has {len(open_alerts)} open security/quality alert(s) on main (must be 0)"
                    )
    except Exception as gh_err:
        sys.stderr.write(f"[warn] GitHub open PR health check skipped: {gh_err}\n")

# Enforce BEL-228 14-Deception Guards (be_anonymous_alexnguyen_fallback, alembic_schema_drift)
for cms_target in (BE_APP / "modules" / "cms" / "service.py", BE_APP / "schemas" / "cms.py"):
    if cms_target.exists() and re.search(r"\balexnguyen\b", cms_target.read_text(encoding="utf-8")):
        violations["4. Async & IDOR Safety (All BE)"].append(
            f"{cms_target.relative_to(ROOT)} -> hardcoded anonymous 'alexnguyen' fallback prohibited (be_anonymous_alexnguyen_fallback == 0)"
        )

alembic_versions_dir = ROOT / "backend" / "alembic" / "versions"
if alembic_versions_dir.exists():
    alembic_all_txt = "\n".join(p.read_text(encoding="utf-8", errors="ignore") for p in alembic_versions_dir.glob("*.py"))
    for model_file in sorted((BE_APP / "models").glob("*.py")):
        for m_tbl in re.finditer(r'__tablename__\s*=\s*["\']([^"\']+)["\']', model_file.read_text(encoding="utf-8")):
            tbl_name = m_tbl.group(1)
            if tbl_name not in alembic_all_txt:
                violations["3. Layer Purity (No Band-Aids)"].append(
                    f"{model_file.relative_to(ROOT)} -> table '{tbl_name}' missing from backend/alembic/versions/ (alembic_schema_drift == 0)"
                )

# --- RENDER VISUAL BENCHMARK SCORECARD ---
print("=" * 78)
print("  BELOOGA ANTI-DECEPTION & PRODUCTION TRUST BENCHMARK (SUPERVISOR GATE)")
print("=" * 78)

total_Penalty = 0
for axis, items in violations.items():
    score = max(0, 100 - len(items) * 25)
    total_Penalty += len(items)
    filled = int(score / 5)
    bar = "█" * filled + "░" * (20 - filled)
    status = "PASS" if score == 100 else "FAIL"
    print(f"  {axis:<34} [{bar}] {score:>3}% ({status})")
    for item in items:
        print(f"     └─ ✗ {item}")

overall = max(0, 100 - total_Penalty * 15)
print("-" * 78)
print(f"  OVERALL AGENT TRUST & PRODUCTION INTEGRITY SCORE: {overall}%  (Violations: {total_Penalty})")
print("=" * 78)
sys.exit(1 if total_Penalty > 0 else 0)
