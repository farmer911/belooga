#!/usr/bin/env python3
"""
lint-skills.py — Top-Tier S Hard-Gate Linter for .agents/ (skills, rules, workflows, ROUTER, GEMINI.md).

Enforces 100% empirical truth across the skill ecosystem:
  1. Valid YAML frontmatter (`yaml.safe_load`) on all skills, rules, and workflows
  2. Zero dangling skill references or hardcoded inventory counts outside AUTO blocks
  3. 100% file path existence (both inline backticks and inside bash code blocks)
  4. 100% `data-testid` existence against `frontend/src/**/*.tsx`
  5. 100% `/v1/...` API endpoint existence against `CURRENT_STATE.md`
  6. 100% coverage of all backend routers & frontend pages in `render-skill-facts.py`,
     and 100% registration of all skills in `.agents/ROUTER.md` and `.agents/evals/triggers.yaml`

Usage:
    python3 scripts/lint-skills.py            # full report
    python3 scripts/lint-skills.py --quiet    # only summary + errors
"""
import ast
import json
import re
import subprocess
import sys
sys.stdout.reconfigure(encoding="utf-8")  # Windows pipes default to cp1252
from pathlib import Path

try:
    import yaml
except ModuleNotFoundError:
    yaml = None

ROOT = Path(__file__).resolve().parent.parent
AGENTS = ROOT / ".agents"
SKILLS_DIR = AGENTS / "skills"
QUIET = "--quiet" in sys.argv

SKILL_MAX_LINES = 200
REF_MAX_LINES = 400
DOMAIN_PREFIXES = ("be-service-", "fe-page-", "be-domain-", "fe-domain-")
REQUIRED_DOMAIN_SECTIONS = ("## Current Reality", "## Known Traps", "## Self-Verification")
SKILL_NAME_PREFIXES = (
    "be-", "fe-", "qc-", "belooga-", "ponytail", "tdd-", "clean-", "definition-",
    "engineering-", "legacy-", "systems-", "enterprise-", "architect-",
)
BARE_SKILL_RE = re.compile(
    r"\b((?:fe-section|fe-page|be-service|fe-domain|be-domain)-[a-z0-9-]+|[a-z]+-(?:reviewer-guide(?:lines)?|patterns-and-practices))\b"
)
COUNT_RE = re.compile(
    r"\b\d{1,3}\s+(?:active\s+|domain\s+|verified\s+)?"
    r"(tables|endpoints|routes|route families|page families|pages|apis|skills)\b",
    re.I,
)
AUTO_BLOCK_RE = re.compile(r"<!-- AUTO:BEGIN -->.*?<!-- AUTO:END -->", re.S)
NEG_PATH_RE = re.compile(
    r"(?:there is no|no|non-existent|nonexistent|does not exist[^`]*)\s+`((?:frontend|backend|qc)?/?(?:src|app)/[\w\-/@\[\]]+)`",
    re.I,
)
CALL_RE = re.compile(r"`([a-z_][a-z0-9_]*)\(([^`()]*)\)`")
# Repo file references, incl. dot-dirs and `@path` imports (CLAUDE.md / .claude/commands).
REPO_FILE_RE = re.compile(
    r"(?:^|[\s`\"@(])((?:frontend|backend|qc|scripts|docs|tests|mobile|k8s|nginx|\.agents|\.github|\.claude|\.githooks)/"
    r"[\w\-/\[\]().]+\.(?:tsx?|py|sql|sh|md|json|ya?ml|conf|toml|csv|mjs|js))"
)
# "skill `x`", "`x` skill", "the x skill"
SKILL_PHRASE_RE = re.compile(r"\b[Ss]kill\s+`([a-z][\w-]*)`|`([a-z][\w-]*)`\s+skill\b|\bthe ([a-z][\w-]+) skill\b")
GLOBAL_SKILLS = {"graphify"}  # installed per user (~/.claude/skills), deliberately not vendored
HEADROOM_TOOLS = {"compress", "retrieve", "stats"}
UI_STACKS_DIR = SKILLS_DIR / "ui-ux-pro-max" / "data" / "stacks"
MACHINE_PATH_RE = re.compile(r"/Users/[A-Za-z0-9_]+/|(?<![\w$])/tmp/[\w.-]+|\b[A-Z]:\\\\?Users\\")

findings = []  # (severity, file, message)


def add(sev, path, msg):
    rel_p = str(path.relative_to(ROOT)) if isinstance(path, Path) and path.is_relative_to(ROOT) else str(path)
    findings.append((sev, rel_p, msg))


# ---------- ground truth from the repo ----------
existing_skills = {p.parent.name for p in SKILLS_DIR.glob("*/SKILL.md")}

py_defs = {}
for f in (ROOT / "backend" / "app").rglob("*.py"):
    try:
        tree = ast.parse(f.read_text(encoding="utf-8"))
    except SyntaxError:
        continue
    for n in ast.walk(tree):
        if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef)):
            params = [a.arg for a in n.args.args if a.arg not in ("self", "cls")]
            py_defs.setdefault(n.name, params)


def pkg_scripts(sub):
    p = ROOT / sub / "package.json"
    if not p.exists():
        return set()
    return set(json.loads(p.read_text(encoding="utf-8")).get("scripts", {}).keys())


scripts = {"qc": pkg_scripts("qc"), "frontend": pkg_scripts("frontend")}

# Ground-truth frontend data-testids
all_fe_testids = set()
for f in (ROOT / "frontend" / "src").rglob("*.tsx"):
    all_fe_testids |= set(re.findall(r'data-testid="([^"]+)"', f.read_text(encoding="utf-8", errors="ignore")))

# Ground-truth backend API endpoints from CURRENT_STATE.md
cs_text = (ROOT / "CURRENT_STATE.md").read_text(encoding="utf-8") if (ROOT / "CURRENT_STATE.md").exists() else ""
valid_api_endpoints = set(re.findall(r"\|\s*`(/v1[^`]*)`\s*\|", cs_text))
valid_api_norm = {ep.rstrip("/") for ep in valid_api_endpoints}


def resolve_path(raw):
    raw = raw.strip("/")
    for base in ("", "frontend/", "mobile/", "backend/", "qc/", "frontend/src/", "mobile/src/", "backend/app/"):
        if (ROOT / (base + raw)).exists():
            return True
    return False


# ---------- per-file checks ----------
def check_frontmatter_yaml(path, text):
    if not text.startswith("---"):
        return None
    parts = text.split("---", 2)
    if len(parts) < 3:
        add("ERROR", path, "unclosed YAML frontmatter block")
        return None
    try:
        if yaml is not None:
            data = yaml.safe_load(parts[1])
        else:
            data = {}
            cur_key = None
            for line in parts[1].strip().splitlines():
                if line.startswith((" ", "\t")) and cur_key:
                    data[cur_key] = (data[cur_key] + " " + line.strip()).strip()
                elif ":" in line:
                    k, v = line.split(":", 1)
                    cur_key = k.strip()
                    val = v.strip().strip("\"'")
                    data[cur_key] = "" if val in (">", ">-", "|", "|-") else val
        if not isinstance(data, dict) or not data:
            add("ERROR", path, "YAML frontmatter must parse to a key-value mapping")
            return None
        return data
    except Exception as e:
        add("ERROR", path, f"invalid YAML frontmatter: {e}")
        return None


def check_machine_paths(path, body):
    m = MACHINE_PATH_RE.search(body)
    if m:
        add("ERROR", path, f"contains a machine-specific absolute path (`{m.group(0)}`); use a repo-relative path")


def check_common(path, text):
    check_frontmatter_yaml(path, text)
    body = AUTO_BLOCK_RE.sub("", text)

    # 1. dangling skill references
    for tok in set(re.findall(r"`([a-z][a-z0-9]*(?:-[a-z0-9]+)+)`", body)):
        if tok.startswith(SKILL_NAME_PREFIXES) and tok not in existing_skills:
            if f'data-testid="{tok}"' in body:
                continue
            add("ERROR", path, f"references skill `{tok}` that does not exist")
    quoted = set(re.findall(r"`([a-z][a-z0-9]*(?:-[a-z0-9]+)+)`", body))
    for tok in set(BARE_SKILL_RE.findall(body)) - quoted:
        if tok not in existing_skills and tok.rstrip("-") not in existing_skills:
            add("ERROR", path, f"mentions skill '{tok}' that does not exist")

    # 2. hardcoded inventory counts outside AUTO blocks
    for m in COUNT_RE.finditer(body):
        add("ERROR", path, f"hardcoded count '{m.group(0)}' (move into an AUTO block or link CURRENT_STATE.md)")

    # 3. negative existence claims that are false
    for m in NEG_PATH_RE.finditer(body):
        if resolve_path(m.group(1)):
            add("ERROR", path, f"claims `{m.group(1)}` does not exist, but it does")

    # 4. function call signatures that contradict backend definitions
    for name, args in CALL_RE.findall(body):
        if name not in py_defs or not args.strip():
            continue
        params = py_defs[name]
        for i, a in enumerate(x.strip() for x in args.split(",")):
            if a in params and params.index(a) != i:
                add("ERROR", path, f"`{name}({args})` has wrong argument order; real signature is ({', '.join(params)})")
                break

    # 5. machine-specific absolute paths
    check_machine_paths(path, body)

    # 5b. paths that leave the repo (`../Beloga-CV`, `../beloga-agent-kanban`): only `../<top-level repo dir>` is allowed
    for name in set(re.findall(r"(?<![\w.])\.\./([A-Za-z][\w.-]*)", body)):
        if not (ROOT / name).exists():
            add("ERROR", path, f"references `../{name}`, which is outside the repo; use an in-repo path (e.g. `legacy/`)")

    # 5c. skills named in prose must exist (vendored) or be declared user-global on the same line
    for line in body.splitlines():
        for groups in set(SKILL_PHRASE_RE.findall(line)):
            tok = next(t for t in groups if t)
            if groups[2] and "-" not in tok and tok not in GLOBAL_SKILLS:
                continue  # plain prose like "the engineering skill"
            if tok in existing_skills:
                continue
            if tok in GLOBAL_SKILLS:
                if "global" not in line.lower():
                    add("ERROR", path, f"`{tok}` is a user-global skill, not vendored in .agents/skills/; say so on that line")
                continue
            add("ERROR", path, f"references skill `{tok}` that does not exist")

    # 5d. ui-ux-pro-max --stack values must have a vendored data/stacks/<stack>.csv
    for val in re.findall(r"--stack\s+([a-z][\w/-]*)", body):
        for stack in val.split("/"):
            if not (UI_STACKS_DIR / f"{stack}.csv").exists():
                add("ERROR", path, f"`--stack {stack}` has no vendored {UI_STACKS_DIR.relative_to(ROOT).as_posix()}/{stack}.csv")

    # 5e. layering pointers to the re-export shim directories
    for m in re.finditer(r"`(?:backend/)?app/(services|repositories)/`", body):
        add("ERROR", path, f"`app/{m.group(1)}/` is a re-export shim; point to `app/modules/<domain>/` instead")

    # 5f. MCP tool names that do not exist
    for tool in set(re.findall(r"\bheadroom_([a-z_]+)", body)) - HEADROOM_TOOLS:
        add("ERROR", path, f"`headroom_{tool}` is not a Headroom MCP tool (have: {', '.join(sorted('headroom_' + t for t in HEADROOM_TOOLS))})")

    # 6. bun scripts that do not exist
    for sub, script in re.findall(r"cd (qc|frontend) && bun run ([\w:\-]+)", body):
        if script not in scripts[sub]:
            add("ERROR", path, f"`cd {sub} && bun run {script}` — script '{script}' not in {sub}/package.json")

    # 7. referenced repo files (both inline backticks AND inside bash commands) that do not exist
    for m in re.finditer(REPO_FILE_RE, body):
        fp = m.group(1)
        if "<" in fp or ">" in fp or "*" in fp or "{" in fp:
            continue
        if not resolve_path(fp):
            add("ERROR", path, f"references missing file `{fp}`")

    # 8. phantom data-testid selectors
    if "ui-ux-pro-max" not in path.parts:
        for tid in set(re.findall(r'data-testid="([^"]+)"', body)):
            if tid != "..." and tid not in all_fe_testids:
                add("ERROR", path, f"references phantom data-testid `{tid}` not found in frontend/src/")

    # 9. invalid /v1/... API endpoint paths
    if valid_api_norm and "ui-ux-pro-max" not in path.parts:
        for m in re.finditer(r"`(?:GET|POST|PUT|PATCH|DELETE)?\s*(/v1/[\w\-{}/]+)`", body):
            ep = m.group(1)
            if "*" in ep or "..." in ep or ep.startswith("/v1/endpoints"):
                continue
            if ep.rstrip("/") not in valid_api_norm:
                add("ERROR", path, f"references invalid API endpoint `{ep}` not in CURRENT_STATE.md")

    # 10. archived docs used as active targets
    if re.search(r"docs/archive/VIOLATIONS_REGISTER\.md", body):
        add("WARN", path, "uses docs/archive/ as an active write target (GEMINI.md declares archive non-authoritative)")


def check_skill(path, text):
    lines = text.splitlines()
    name = path.parent.name
    if len(lines) > SKILL_MAX_LINES:
        add("ERROR", path, f"{len(lines)} lines > {SKILL_MAX_LINES}; move detail into references/")
    fm = check_frontmatter_yaml(path, text)
    if not fm:
        return
    if fm.get("name") != name:
        add("ERROR", path, "frontmatter name does not match directory")
    desc = str(fm.get("description", "")).strip()
    if not desc:
        add("ERROR", path, "missing description")
    else:
        if len(desc) > 1024:
            add("ERROR", path, "description > 1024 chars")
        if not re.search(r"\buse (when|on|whenever)\b|\btrigger", desc, re.I):
            add("ERROR", path, "description has no 'Use when …' trigger clause")
        if name.startswith(DOMAIN_PREFIXES) and not re.search(r"\bnot for\b|\bdo not use\b", desc, re.I):
            add("WARN", path, "domain skill description has no 'Not for …' boundary")
    if name.startswith(DOMAIN_PREFIXES):
        for sec in REQUIRED_DOMAIN_SECTIONS:
            if sec not in text:
                add("ERROR", path, f"domain skill missing section '{sec}'")
        if "<!-- AUTO:BEGIN -->" not in text:
            add("ERROR", path, "domain skill has no generated AUTO block for its AS-IS facts")


def check_reference(path, text):
    n = len(text.splitlines())
    if n > REF_MAX_LINES:
        add("ERROR", path, f"{n} lines > {REF_MAX_LINES}")
    if re.search(r"TARGET (REFACTORING|ARCHITECTURE)|TO-BE|planned target", text):
        add("ERROR", path, "contains TO-BE / planned-target content; move to docs/adr/")


def check_ecosystem_coverage():
    # Verify 100% of backend routers & frontend pages are registered in render-skill-facts.py
    rsf_src = (ROOT / "scripts" / "render-skill-facts.py").read_text(encoding="utf-8")
    tree = ast.parse(rsf_src)
    be_mapped, fe_mapped = set(), set()
    for n in ast.walk(tree):
        if isinstance(n, ast.Assign) and len(n.targets) == 1 and isinstance(n.targets[0], ast.Name):
            tname = n.targets[0].id
            if tname in ("BACKEND", "FRONTEND") and isinstance(n.value, ast.Dict):
                vals = {elt.value for v in n.value.values if isinstance(v, ast.List) for elt in v.elts if isinstance(elt, ast.Constant)}
                if tname == "BACKEND":
                    be_mapped = vals
                else:
                    fe_mapped = vals

    actual_be = {p.name for p in (ROOT / "backend" / "app" / "api" / "v1" / "endpoints").glob("*.py") if p.name != "__init__.py"}
    actual_fe = {p.relative_to(ROOT / "frontend" / "src" / "app").as_posix() for p in (ROOT / "frontend" / "src" / "app").rglob("page.tsx")}

    for unmapped in sorted(actual_be - be_mapped):
        add("ERROR", ROOT / "scripts" / "render-skill-facts.py", f"backend endpoint module `{unmapped}` is not covered by any be-service-* skill")
    for unmapped in sorted(actual_fe - fe_mapped):
        add("ERROR", ROOT / "scripts" / "render-skill-facts.py", f"frontend page `{unmapped}` is not covered by any fe-page-* skill")

    # Verify 100% of skills are in ROUTER.md and triggers.yaml
    router_txt = (AGENTS / "ROUTER.md").read_text(encoding="utf-8") if (AGENTS / "ROUTER.md").exists() else ""
    for sk in sorted(existing_skills):
        if f"`{sk}`" not in router_txt:
            add("ERROR", AGENTS / "ROUTER.md", f"skill `{sk}` missing from ROUTER.md")

    trig_path = AGENTS / "evals" / "triggers.yaml"
    if trig_path.exists():
        trig_raw = trig_path.read_text(encoding="utf-8")
        if yaml is not None:
            trig_data = yaml.safe_load(trig_raw) or []
            trig_skills = {item.get("skill") for item in trig_data if isinstance(item, dict)}
        else:
            trig_skills = set(re.findall(r"^\s*-\s*skill:\s*(\S+)", trig_raw, re.M))
        for sk in sorted(existing_skills - trig_skills):
            add("ERROR", trig_path, f"skill `{sk}` missing from triggers.yaml evaluation dataset")

    # Enforce strict repository markdown whitelist (prevent redundant .md sprawl)
    allowed_md = {"CURRENT_STATE.md", "GEMINI.md", "README.md", "docs/VIOLATIONS_REGISTER.md", "docs/ponytail-debt.md", "frontend/AGENTS.md", "CLAUDE.md"}
    for md in ROOT.rglob("*.md"):
        rel = md.relative_to(ROOT).as_posix()
        if any(rel.startswith(p) for p in (".agents/", "docs/adr/", "legacy/", "node_modules/", "frontend/node_modules/", "frontend/.next/", "mobile/node_modules/", "mobile/.expo/", "qc/node_modules/", "qc/playwright-report/", "qc/test-results/", "backend/.venv/", ".pytest_cache/", ".git/", ".claude/", ".githooks/", "graphify-out/")):
            continue
        if rel not in allowed_md:
            add("ERROR", md, f"redundant/unapproved markdown file `{rel}` outside canonical SSOT whitelist")


targets = (
    sorted(AGENTS.rglob("*.md")) + [ROOT / "GEMINI.md", ROOT / "README.md", ROOT / "CLAUDE.md"]
    + sorted((ROOT / "docs" / "adr").glob("*.md"))
    + sorted((ROOT / ".claude" / "commands").glob("*.md")) + sorted((ROOT / ".claude" / "agents").glob("*.md"))
)
for p in targets:
    if not p.exists():
        continue
    t = p.read_text(encoding="utf-8", errors="ignore")
    if p.name != "STATE.md":
        check_common(p, t)
    else:
        check_machine_paths(p, t)
    if p.name == "SKILL.md":
        check_skill(p, t)
    elif p.name == "STATE.md" and len(t.splitlines()) > 50:
        add("ERROR", p, f"{len(t.splitlines())} lines > 50 (STATE.md scratchpad cap)")
    elif p.name == "PRODUCT_THESIS.md" and len(t.splitlines()) > 120:
        add("ERROR", p, f"{len(t.splitlines())} lines > 120 (PRODUCT_THESIS.md zero-sum cap)")
    elif "references" in p.parts:
        check_reference(p, t)

check_ecosystem_coverage()

# Claude Code mirror (.claude/skills stubs) must match .agents/skills
_sync = subprocess.run([sys.executable, str(ROOT / "scripts" / "sync-claude-skills.py"), "--check"],
                       capture_output=True, text=True, encoding="utf-8")
if _sync.returncode != 0:
    add("ERROR", ROOT / ".claude" / "skills", "out of sync with .agents/skills; run `python3 scripts/sync-claude-skills.py`\n" + _sync.stdout.rstrip())

# ---------- report ----------
by_file = {}
for sev, f, msg in findings:
    by_file.setdefault(f, []).append((sev, msg))

errors = sum(1 for s, _, _ in findings if s == "ERROR")
warns = sum(1 for s, _, _ in findings if s == "WARN")

for f in sorted(by_file):
    items = by_file[f]
    if QUIET and not any(s == "ERROR" for s, _ in items):
        continue
    print(f"\n{f}")
    for sev, msg in items:
        if QUIET and sev != "ERROR":
            continue
        print(f"  [{sev}] {msg}")

clean = sorted(existing_skills - {Path(f).parent.name for f in by_file if f.endswith("SKILL.md")})
print(f"\nSkills: {len(existing_skills)} | clean: {len(clean)} | ERROR: {errors} | WARN: {warns}")
sys.exit(1 if errors else 0)
