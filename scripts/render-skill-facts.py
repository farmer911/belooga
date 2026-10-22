#!/usr/bin/env python3
"""
render-skill-facts.py — Regenerate the <!-- AUTO:BEGIN --> ... <!-- AUTO:END --> block
inside every be-domain-* / fe-domain-* SKILL.md from live source code.

Humans and agents edit everything OUTSIDE the AUTO block. The block itself is owned
by this script, so AS-IS facts (files, routes, auth, tests, test IDs) cannot drift.

Usage:
    python3 scripts/render-skill-facts.py          # rewrite blocks in place
    python3 scripts/render-skill-facts.py --write  # rewrite blocks in place
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

# 100% coverage of all 12 backend router modules across 3 Bounded-Context skills
BACKEND = {
    "be-domain-core": ["auth.py", "profile.py", "timeline.py", "media.py", "notifications.py"],
    "be-domain-discovery": ["search.py", "catalogs.py", "cms.py"],
    "be-domain-monetization": ["expert_review.py", "ats_matching.py", "job_tracker.py", "analytics.py", "payments.py"],
}

BACKEND_TESTS = {
    "be-domain-core": [
        "test_auth_family_rotation.py",
        "test_event_stream_and_k8s_probes.py",
        "test_fullstack_seo_gateway.py",
        "test_gateway_and_cache_optimization.py",
        "test_idor_guards.py",
        "test_media_traversal.py",
        "test_notifications.py",
        "test_production_readiness_suite.py",
        "test_profile_privacy_and_pii.py",
        "test_rpc_and_dossier_optimization.py",
        "test_sql_and_flow_optimization.py",
        "test_timeline_reorder.py",
    ],
    "be-domain-discovery": [
        "test_backend_foundation.py",
        "test_catalogs_salary.py",
        "test_high_scale_and_shortlist.py",
        "test_profile_privacy_and_pii.py",
    ],
    "be-domain-monetization": [
        "test_analytics.py",
        "test_ats_matching.py",
        "test_expert_review.py",
        "test_high_scale_and_shortlist.py",
        "test_job_tracker.py",
        "test_momo_payment.py",
        "test_production_readiness_suite.py",
    ],
}

# 100% coverage of all 23 frontend page.tsx files across 3 Bounded-Context skills
FRONTEND = {
    "fe-domain-workspace": [
        "user/[username]/page.tsx",
        "user/[username]/update/page.tsx",
        "user/[username]/settings/page.tsx",
        "(auth)/login/page.tsx",
        "(auth)/register/page.tsx",
        "(auth)/forgot-password/page.tsx",
        "(auth)/callback/page.tsx",
    ],
    "fe-domain-public": [
        "page.tsx",
        "search/page.tsx",
        "companies/page.tsx",
        "companies/[slug]/page.tsx",
        "public/[username]/page.tsx",
        "(public)/blog/page.tsx",
        "(public)/blog/[slug]/page.tsx",
        "(public)/careers/page.tsx",
        "(public)/contact-us/page.tsx",
        "(public)/help/page.tsx",
        "(public)/privacy-policy/page.tsx",
        "(public)/terms-and-conditions/page.tsx",
    ],
    "fe-domain-career-tools": [
        "(public)/expert-review/page.tsx",
        "ats-diagnostics/page.tsx",
        "cv-studio/page.tsx",
        "salary-benchmark/page.tsx",
        "workspace/jobs/page.tsx",
        "workspace/wallet/page.tsx",
        "workspace/analytics/page.tsx",
        "recruiter/hub/page.tsx",
        "admin/analytics/page.tsx",
    ],
}

BLOCK_RE = re.compile(r"<!-- AUTO:BEGIN -->.*?<!-- AUTO:END -->", re.S)
rel = lambda p: str(p.relative_to(ROOT))


def find_module(dotted):
    p = ROOT / "backend" / (dotted.replace(".", "/") + ".py")
    if p.exists():
        return p
    init_p = ROOT / "backend" / dotted.replace(".", "/") / "service.py"
    return init_p if init_p.exists() else None


def backend_facts(skill_name, modules):
    out, services, repos = [], set(), set()
    out.append("| Method | Path | Handler | Auth |")
    out.append("|---|---|---|---|")
    for mod in modules:
        f = EP_DIR / mod
        src_text = f.read_text(encoding="utf-8")
        tree = ast.parse(src_text)
        router_prefix = ""
        for n in ast.walk(tree):
            if isinstance(n, ast.Call) and getattr(n.func, "id", "") == "APIRouter":
                for kw in n.keywords:
                    if kw.arg == "prefix" and isinstance(kw.value, ast.Constant):
                        router_prefix = kw.value.value
        for n in ast.walk(tree):
            if isinstance(n, ast.ImportFrom) and n.module and n.module.startswith(("app.services", "app.modules")):
                m = find_module(n.module)
                if m:
                    services.add(m)
            if not isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef)):
                continue
            for d in n.decorator_list:
                if isinstance(d, ast.Call) and getattr(d.func, "attr", "") in ("get", "post", "put", "patch", "delete"):
                    src = ast.get_source_segment(src_text, n) or ""
                    auth = (
                        "required"
                        if "Depends(get_current_user)" in src
                        else "optional"
                        if "get_current_user_optional" in src
                        else "public"
                    )
                    out.append(f"| `{d.func.attr.upper()}` | `/v1{router_prefix}{d.args[0].value}` | `{n.name}` | {auth} |")
    for s in list(services):
        s_txt = s.read_text(encoding="utf-8")
        if (s.parent / "repository.py").exists():
            repos.add(s.parent / "repository.py")
        for m in re.findall(r"from (app\.(?:services|modules)\.[\w.]+) import", s_txt):
            p = find_module(m)
            if p and p.name != "repository.py":
                services.add(p)
        for m in re.findall(r"from (app\.(?:repositories|modules)\.[\w.]+) import", s_txt):
            p = find_module(m)
            if p and (p.name.endswith("_repo.py") or p.name == "repository.py"):
                repos.add(p)
    tests = [
        ROOT / "backend" / "tests" / t
        for t in BACKEND_TESTS.get(skill_name, [])
        if (ROOT / "backend" / "tests" / t).exists()
    ]
    out.append("")
    out.append("- Router: " + ", ".join(f"`{rel(EP_DIR / m)}`" for m in modules))
    out.append("- Service: " + (", ".join(f"`{rel(s)}`" for s in sorted(services)) or "_none_"))
    out.append("- Repository: " + (", ".join(f"`{rel(r)}`" for r in sorted(repos)) or "_none_"))
    out.append("- Tests: " + (", ".join(f"`{rel(t)}`" for t in sorted(tests)) or "_none — add one_"))
    return out


def resolve_fe_import(current_file: Path, spec: str) -> Path | None:
    if spec.startswith("@/"):
        base = FE / spec[2:]
    elif spec.startswith("."):
        base = (current_file.parent / spec).resolve()
    else:
        return None
    for ext in (".tsx", ".ts"):
        cand = Path(str(base) + ext)
        if cand.exists():
            return cand
    return None


def frontend_facts(pages):
    out, comps, hooks, tids = [], set(), set(), set()
    queue = []
    seen = set()
    for pg in pages:
        f = FE / "app" / pg
        if not f.exists():
            out.append(f"- MISSING page `frontend/src/app/{pg}`")
            continue
        t = f.read_text(encoding="utf-8")
        kind = "client" if t.lstrip().startswith(('"use client"', "'use client'")) else "server"
        out.append(f"- Page: `{rel(f)}` ({len(t.splitlines())} lines, {kind} component)")
        tids |= set(re.findall(r'data-testid="([^"]+)"', t))
        queue.append(f)
        seen.add(f)

    while queue:
        cur = queue.pop(0)
        txt = cur.read_text(encoding="utf-8")
        for spec in re.findall(r'(?:from |import\()"((?:@/|\.\.?/)[\w\-/.]+)"', txt):
            target = resolve_fe_import(cur, spec)
            if not target or not target.is_relative_to(FE):
                continue
            rel_fe = target.relative_to(FE).as_posix()
            if rel_fe.startswith("hooks/"):
                hooks.add(target)
            elif rel_fe.startswith("components/"):
                comps.add(target)
            else:
                continue
            tids |= set(re.findall(r'data-testid="([^"]+)"', target.read_text(encoding="utf-8")))
            if target not in seen and (rel_fe.startswith("components/features/") or rel_fe.startswith("hooks/")):
                seen.add(target)
                queue.append(target)

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
    lines = backend_facts(name, spec) if name in BACKEND else frontend_facts(spec)
    block = (
        "<!-- AUTO:BEGIN -->\n<!-- Generated by scripts/render-skill-facts.py. Do not edit by hand. -->\n"
        + "\n".join(lines)
        + "\n<!-- AUTO:END -->"
    )
    text = skill.read_text(encoding="utf-8")
    if "<!-- AUTO:BEGIN -->" not in text:
        stale.append(f"{name}: no AUTO block")
        continue
    new = BLOCK_RE.sub(lambda _: block, text)
    if new != text:
        stale.append(f"{name}: AUTO block stale")
        if not CHECK:
            skill.write_text(new, encoding="utf-8")

if CHECK and stale:
    print("\n".join(stale))
    sys.exit(1)
print("\n".join(stale) if stale else "All AUTO blocks up to date.")
