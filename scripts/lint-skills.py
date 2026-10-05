#!/usr/bin/env python3
"""
lint-skills.py — Hard-gate linter for .agents/ (skills, rules, workflows, ROUTER, GEMINI.md).

Checks what a reviewer would otherwise check by hand. Every finding is a fact
about the repo, not an opinion. Exit 1 if any ERROR is found.

Usage:
    python3 scripts/lint-skills.py            # full report
    python3 scripts/lint-skills.py --quiet    # only summary + errors
"""
import ast
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
AGENTS = ROOT / ".agents"
SKILLS_DIR = AGENTS / "skills"
QUIET = "--quiet" in sys.argv

SKILL_MAX_LINES = 200
REF_MAX_LINES = 400
DOMAIN_PREFIXES = ("be-service-", "fe-page-")
REQUIRED_DOMAIN_SECTIONS = ("## Current Reality", "## Known Traps", "## Self-Verification")
SKILL_NAME_PREFIXES = (
    "be-", "fe-", "qc-", "belooga-", "ponytail", "tdd-", "clean-", "definition-",
    "engineering-", "legacy-", "systems-", "enterprise-", "architect-",
)
# Unquoted mentions are only checked for unambiguous skill-family patterns
BARE_SKILL_RE = re.compile(
    r"\b((?:fe-section|fe-page|be-service)-[a-z0-9-]+|[a-z]+-(?:reviewer-guide(?:lines)?|patterns-and-practices))\b"
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

findings = []  # (severity, file, message)


def add(sev, path, msg):
    findings.append((sev, str(path.relative_to(ROOT)), msg))


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
    return set(json.loads(p.read_text()).get("scripts", {}).keys())


scripts = {"qc": pkg_scripts("qc"), "frontend": pkg_scripts("frontend")}


def resolve_path(raw):
    raw = raw.strip("/")
    for base in ("", "frontend/", "backend/"):
        if (ROOT / (base + raw)).exists():
            return True
    return False


# ---------- per-file checks ----------
def check_common(path, text):
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
    if re.search(r"/Users/[A-Za-z0-9_]+/", body):
        add("ERROR", path, "contains a machine-specific absolute path (/Users/...); use $LEGACY_DIR")

    # 6. bun scripts that do not exist
    for sub, script in re.findall(r"cd (qc|frontend) && bun run ([\w:\-]+)", body):
        if script not in scripts[sub]:
            add("ERROR", path, f"`cd {sub} && bun run {script}` — script '{script}' not in {sub}/package.json")

    # 7. referenced repo files that do not exist
    for fp in set(re.findall(r"`((?:frontend|backend|qc|scripts|docs)/[\w\-/\[\]().]+\.(?:tsx?|py|sql|sh|md|json))`", body)):
        if not (ROOT / fp).exists():
            add("ERROR", path, f"references missing file `{fp}`")

    # 8. archived docs used as active targets
    if re.search(r"docs/archive/VIOLATIONS_REGISTER\.md", body):
        add("WARN", path, "uses docs/archive/ as an active write target (GEMINI.md declares archive non-authoritative)")


def check_skill(path, text):
    lines = text.splitlines()
    name = path.parent.name
    if len(lines) > SKILL_MAX_LINES:
        add("ERROR", path, f"{len(lines)} lines > {SKILL_MAX_LINES}; move detail into references/")
    if not text.startswith("---"):
        add("ERROR", path, "missing YAML frontmatter")
        return
    fm = text.split("---", 2)[1]
    m_name = re.search(r"^name:\s*(\S+)", fm, re.M)
    if not m_name or m_name.group(1) != name:
        add("ERROR", path, "frontmatter name does not match directory")
    m_desc = re.search(r"description:\s*>?\s*(.*?)(?=\n[a-z][\w-]*:|\Z)", fm, re.S)
    desc = " ".join(m_desc.group(1).split()) if m_desc else ""
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


targets = sorted(AGENTS.rglob("*.md")) + [ROOT / "GEMINI.md", ROOT / "CLAUDE.md"]
for p in targets:
    if not p.exists():
        continue
    t = p.read_text(encoding="utf-8", errors="ignore")
    check_common(p, t)
    if p.name == "SKILL.md":
        check_skill(p, t)
    elif "references" in p.parts:
        check_reference(p, t)

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
