#!/usr/bin/env python3
"""
render-skill-facts.py — Regenerate the <!-- AUTO:BEGIN --> ... <!-- AUTO:END --> block
inside every be-service-* / fe-page-* SKILL.md from live source code.

Humans and agents edit everything OUTSIDE the AUTO block. The block itself is owned
by this script, so AS-IS facts (files, routes, auth, tests, test IDs) cannot drift.

Usage:
    python3 scripts/render-skill-facts.py          # rewrite blocks in place
    python3 scripts/render-skill-facts.py --check  # exit 1 if any block is stale (CI)
"""
import ast
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SKILLS = ROOT / ".agents" / "skills"
EP_DIR = ROOT / "backend" / "app" / "api" / "v1" / "endpoints"
FE = ROOT / "frontend" / "src"
CHECK = "--check" in sys.argv

# skill -> endpoint module(s) (backend) or page file(s) relative to frontend/src/app (frontend)
BACKEND = {
    "be-service-auth": ["auth.py"],
    "be-service-profile": ["profile.py"],
    "be-service-timeline": ["timeline.py"],
    "be-service-media": ["media.py"],
    "be-service-search": ["search.py"],
    "be-service-catalogs": ["catalogs.py"],
    "be-service-cms": ["cms.py"],
    "be-service-expert-review": ["expert_review.py"],
}
FRONTEND = {
    "fe-page-home": ["page.tsx"],
    "fe-page-search": ["search/page.tsx"],
    "fe-page-public-profile": ["public/[username]/page.tsx"],
    "fe-page-workspace": ["user/[username]/page.tsx"],
    "fe-page-user-management": ["user/[username]/update/page.tsx", "user/[username]/settings/page.tsx"],
    "fe-page-auth": ["(auth)/login/page.tsx", "(auth)/register/page.tsx",
                     "(auth)/forgot-password/page.tsx", "(auth)/callback/page.tsx"],
    "fe-page-cms-public": ["(public)/blog/page.tsx", "(public)/careers/page.tsx",
                           "(public)/contact-us/page.tsx", "(public)/help/page.tsx",
                           "(public)/privacy-policy/page.tsx", "(public)/terms-and-conditions/page.tsx"],
    "fe-page-expert-review": ["(public)/expert-review/page.tsx"],
}

BLOCK_RE = re.compile(r"<!-- AUTO:BEGIN -->.*?<!-- AUTO:END -->", re.S)
rel = lambda p: str(p.relative_to(ROOT))


def find_module(dotted):
    p = ROOT / "backend" / (dotted.replace(".", "/") + ".py")
    return p if p.exists() else None


def backend_facts(modules):
    out, services, tests = [], set(), set()
    out.append("| Method | Path | Handler | Auth |")
    out.append("|---|---|---|---|")
    for mod in modules:
        f = EP_DIR / mod
        tree = ast.parse(f.read_text())
        for n in ast.walk(tree):
            if isinstance(n, ast.ImportFrom) and n.module and n.module.startswith("app.services"):
                m = find_module(n.module)
                if m:
                    services.add(m)
            if not isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef)):
                continue
            for d in n.decorator_list:
                if isinstance(d, ast.Call) and getattr(d.func, "attr", "") in ("get", "post", "put", "patch", "delete"):
                    src = ast.get_source_segment(f.read_text(), n) or ""
                    auth = ("required" if "Depends(get_current_user)" in src
                            else "optional" if "get_current_user_optional" in src else "public")
                    out.append(f"| `{d.func.attr.upper()}` | `/v1{d.args[0].value}` | `{n.name}` | {auth} |")
    repos = set()
    for s in services:
        for m in re.findall(r"from (app\.repositories\.\w+) import", s.read_text()):
            p = find_module(m)
            if p:
                repos.add(p)
    keys = {Path(m).stem for m in modules} | {s.stem.replace("_service", "") for s in services}
    for t in (ROOT / "backend" / "tests").glob("test_*.py"):
        body = t.read_text()
        if any(k in t.stem or f"{k}_service" in body or f"/{k}" in body for k in keys):
            tests.add(t)
    out.append("")
    out.append("- Router: " + ", ".join(f"`{rel(EP_DIR / m)}`" for m in modules))
    out.append("- Service: " + (", ".join(f"`{rel(s)}`" for s in sorted(services)) or "_none_"))
    out.append("- Repository: " + (", ".join(f"`{rel(r)}`" for r in sorted(repos)) or "_none_"))
    out.append("- Tests: " + (", ".join(f"`{rel(t)}`" for t in sorted(tests)) or "_none — add one_"))
    return out


def frontend_facts(pages):
    out, comps, hooks, tids = [], set(), set(), set()
    for pg in pages:
        f = FE / "app" / pg
        if not f.exists():
            out.append(f"- MISSING page `frontend/src/app/{pg}`")
            continue
        t = f.read_text()
        kind = "client" if t.lstrip().startswith(('"use client"', "'use client'")) else "server"
        out.append(f"- Page: `{rel(f)}` ({len(t.splitlines())} lines, {kind} component)")
        tids |= set(re.findall(r'data-testid="([^"]+)"', t))
        imports = re.findall(r'(?:from |import\()"@/(components/[\w\-/]+|hooks/[\w\-]+)"', t)
        for imp in list(imports):
            p = next((FE / (imp + ext) for ext in (".tsx", ".ts") if (FE / (imp + ext)).exists()), None)
            if p and imp.startswith("components/features"):
                imports += re.findall(r'(?:from |import\()"@/(hooks/[\w\-]+)"', p.read_text())
        for imp in dict.fromkeys(imports):
            p = next((FE / (imp + ext) for ext in (".tsx", ".ts") if (FE / (imp + ext)).exists()), None)
            if not p:
                continue
            (hooks if imp.startswith("hooks/") else comps).add(p)
            tids |= set(re.findall(r'data-testid="([^"]+)"', p.read_text()))
    out.append("- Components: " + (", ".join(f"`{rel(c)}`" for c in sorted(comps)) or "_inline_"))
    out.append("- Hooks: " + (", ".join(f"`{rel(h)}`" for h in sorted(hooks)) or "_none_"))
    out.append("- data-testid: " + (", ".join(f"`{x}`" for x in sorted(tids)) or "_none — add before writing E2E_"))
    return out


stale = []
for name, spec in {**BACKEND, **FRONTEND}.items():
    skill = SKILLS / name / "SKILL.md"
    if not skill.exists():
        stale.append(f"{name}: SKILL.md missing")
        continue
    lines = backend_facts(spec) if name in BACKEND else frontend_facts(spec)
    block = ("<!-- AUTO:BEGIN -->\n<!-- Generated by scripts/render-skill-facts.py. Do not edit by hand. -->\n"
             + "\n".join(lines) + "\n<!-- AUTO:END -->")
    text = skill.read_text()
    if "<!-- AUTO:BEGIN -->" not in text:
        stale.append(f"{name}: no AUTO block")
        continue
    new = BLOCK_RE.sub(lambda _: block, text)
    if new != text:
        stale.append(f"{name}: AUTO block stale")
        if not CHECK:
            skill.write_text(new)

if CHECK and stale:
    print("\n".join(stale))
    sys.exit(1)
print("\n".join(stale) if stale else "All AUTO blocks up to date.")
