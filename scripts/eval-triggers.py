#!/usr/bin/env python3
"""
eval-triggers.py - measure skill routing accuracy on .agents/evals/triggers.yaml.

For every prompt in the dataset, an LLM sees only the skill names + descriptions (from
.agents/skills/*/SKILL.md frontmatter) and must answer with one skill name. A
`should_trigger` prompt expects its entry's `skill`; a `should_not_trigger` prompt expects
its own `expected`. Exits 1 when accuracy < --min (default 0.8).

Usage:
    GEMINI_API_KEY=... python3 scripts/eval-triggers.py [--min 0.8] [--limit N]
Without GEMINI_API_KEY it prints SKIPPED and exits 0.
"""
import argparse
import json
import os
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")  # Windows pipes default to cp1252
sys.path.insert(0, str(Path(__file__).resolve().parent))

ROOT = Path(__file__).resolve().parent.parent
TRIGGERS = ROOT / ".agents" / "evals" / "triggers.yaml"
SKILLS = ROOT / ".agents" / "skills"


def load_cases() -> list[tuple[str, str]]:
    """(prompt, expected_skill) pairs. Uses PyYAML when present, else a parser for this file's shape."""
    raw = TRIGGERS.read_text(encoding="utf-8")
    try:
        import yaml
        data = yaml.safe_load(raw) or []
    except ModuleNotFoundError:
        data, cur, mode = [], None, None
        for line in raw.splitlines():
            s = line.strip()
            if s.startswith("- skill:"):
                cur = {"skill": s.split(":", 1)[1].strip(), "should_trigger": [], "should_not_trigger": []}
                data.append(cur)
            elif s in ("should_trigger:", "should_not_trigger:"):
                mode = s[:-1]
            elif cur and mode == "should_trigger" and s.startswith("- "):
                cur["should_trigger"].append(s[2:].strip().strip("\"'"))
            elif cur and mode == "should_not_trigger" and s.startswith("- prompt:"):
                cur["should_not_trigger"].append({"prompt": s.split(":", 1)[1].strip().strip("\"'")})
            elif cur and mode == "should_not_trigger" and s.startswith("expected:"):
                cur["should_not_trigger"][-1]["expected"] = s.split(":", 1)[1].strip()
    cases = []
    for item in data:
        cases += [(p, item["skill"]) for p in item.get("should_trigger", [])]
        cases += [(n["prompt"], n["expected"]) for n in item.get("should_not_trigger", []) if n.get("expected")]
    return cases


def load_catalog() -> dict[str, str]:
    from importlib.util import module_from_spec, spec_from_file_location

    spec = spec_from_file_location("sync_claude_skills", Path(__file__).with_name("sync-claude-skills.py"))
    mod = module_from_spec(spec)
    spec.loader.exec_module(mod)
    return {p.parent.name: mod.frontmatter(p.read_text(encoding="utf-8")).get("description", "")
            for p in sorted(SKILLS.glob("*/SKILL.md"))}


def build_prompt(catalog: dict[str, str], user_prompt: str) -> str:
    skills = "\n".join(f"- {name}: {desc}" for name, desc in catalog.items())
    return (
        "You route developer requests to exactly one skill. Available skills:\n"
        f"{skills}\n\n"
        f"Request: {user_prompt}\n\n"
        'Answer with JSON only: {"skill": "<one skill name from the list>"}'
    )


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--min", type=float, default=0.8, help="minimum accuracy (0-1)")
    ap.add_argument("--limit", type=int, default=0, help="evaluate only the first N cases")
    args = ap.parse_args()

    cases = load_cases()
    if args.limit:
        cases = cases[: args.limit]
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        print(f"SKIPPED: GEMINI_API_KEY not set ({len(cases)} cases in {TRIGGERS.relative_to(ROOT).as_posix()}).")
        return 0

    from gemini_client import candidate_models, generate

    catalog = load_catalog()
    models = candidate_models(api_key)[:1]  # one model for the whole run so scores are comparable
    hits, misses = 0, []
    for prompt, want in cases:
        try:
            got = json.loads(generate(api_key, build_prompt(catalog, prompt), json_mode=True,
                                      temperature=0.0, max_tokens=64, models=models)).get("skill", "")
        except Exception as e:
            got = f"<error: {e}>"
        if got == want:
            hits += 1
        else:
            misses.append((prompt, want, got))

    acc = hits / len(cases) if cases else 0.0
    for prompt, want, got in misses:
        print(f"  MISS expected={want} got={got} :: {prompt}")
    print(f"Skill routing accuracy ({models[0]}): {hits}/{len(cases)} = {acc:.0%} (min {args.min:.0%})")
    return 0 if acc >= args.min else 1


if __name__ == "__main__":
    sys.exit(main())
