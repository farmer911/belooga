"""scripts/ai-code-reviewer.py: verdict parsing, PR domain coverage and reference loading."""
import importlib.util
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts"))
_spec = importlib.util.spec_from_file_location("ai_code_reviewer", ROOT / "scripts" / "ai-code-reviewer.py")
reviewer = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(reviewer)


def test_verdict_reads_the_chosen_value_not_the_template():
    assert not reviewer.has_blocking_verdict("### 🎯 Verdict: [PASS ✅ | WARNINGS ⚠️ | CHANGES REQUESTED 🛑]")
    assert not reviewer.has_blocking_verdict("### 🎯 Verdict: PASS ✅ (no CHANGES REQUESTED needed)")
    assert not reviewer.has_blocking_verdict("### 🎯 Verdict: WARNINGS ⚠️")
    assert reviewer.has_blocking_verdict("### 🎯 Verdict: CHANGES REQUESTED 🛑")
    assert reviewer.has_blocking_verdict("### 🎯 Verdict: **CHANGES REQUESTED** 🛑")
    assert reviewer.has_blocking_verdict("### 🎯 Verdict:\n**CHANGES REQUESTED 🛑**")


def test_every_changed_path_lands_in_a_reviewed_domain():
    diff = "".join(
        f"diff --git a/{p} b/{p}\n+x\n"
        for p in (".agents/skills/x/SKILL.md", "qc/tests/a.spec.ts", "k8s/a.yaml", "mobile/app/a.tsx")
    )
    parts = reviewer.partition_diff_by_domain(diff)
    assert parts["mobile"] and parts["other"]
    with open(ROOT / ".github" / "workflows" / "ai-code-review.yml", encoding="utf-8") as f:
        pr_job = yaml.safe_load(f)["jobs"]["ai-review-pr"]
    assert set(pr_job["strategy"]["matrix"]["domain"]) == set(parts), "every diff bucket needs a PR review job"


def test_domain_rules_include_cited_references():
    be = reviewer.read_domain_review_rules("backend")
    fe = reviewer.read_domain_review_rules("frontend")
    assert "Back-of-the-Envelope Estimation" in be  # body of system-design-primer.md
    assert "Core Web Vitals" in fe  # body of frontend-system-design.md
