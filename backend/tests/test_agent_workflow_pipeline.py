"""Unit & Contract Tests for Multi-Agent Worktree, Split FE/BE Code Review & PM Kanban Pipeline."""

import importlib.util
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
SCRIPTS_DIR = str(ROOT_DIR / "scripts")
if SCRIPTS_DIR not in sys.path:
    sys.path.insert(0, SCRIPTS_DIR)


def _load_script(script_name: str):
    script_path = ROOT_DIR / "scripts" / script_name
    spec = importlib.util.spec_from_file_location(script_name.replace("-", "_").removesuffix(".py"), script_path)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_agent_dispatch_computes_isolated_worktree_and_symlinks(tmp_path: Path):
    """Verify agent-dispatch computes isolated git worktree paths and symlinks shared dependencies."""
    dispatch = _load_script("agent-dispatch.py")
    wt_path = dispatch.worktree_path_for(246, "[BEL-246] Refactor Auth Login", base_dir=tmp_path)
    assert wt_path == tmp_path / "BEL-246-refactor-auth-login"

    # Simulate shared dependency symlink creation inside an isolated worktree
    fake_root = tmp_path / "repo"
    (fake_root / "backend" / ".venv").mkdir(parents=True)
    (fake_root / "frontend" / "node_modules").mkdir(parents=True)
    (fake_root / "mobile" / "node_modules").mkdir(parents=True)
    (wt_path / "backend").mkdir(parents=True)
    (wt_path / "frontend").mkdir(parents=True)
    (wt_path / "mobile").mkdir(parents=True)

    linked = dispatch.symlink_shared_deps(fake_root, wt_path)
    assert len(linked) == 3
    assert (wt_path / "backend" / ".venv").is_symlink()
    assert (wt_path / "frontend" / "node_modules").is_symlink()
    assert (wt_path / "mobile" / "node_modules").is_symlink()


def test_ai_code_reviewer_partitions_fe_be_diffs_and_detects_blocking_verdict():
    """Verify ai-code-reviewer splits diffs into backend/frontend/mobile domains and enforces blocking verdicts."""
    reviewer = _load_script("ai-code-reviewer.py")
    sample_diff = (
        "diff --git a/backend/app/api/v1/endpoints/auth.py b/backend/app/api/v1/endpoints/auth.py\n"
        "--- a/backend/app/api/v1/endpoints/auth.py\n"
        "+++ b/backend/app/api/v1/endpoints/auth.py\n"
        "@@ -1,2 +1,3 @@\n"
        "+# backend change\n"
        "diff --git a/frontend/src/app/page.tsx b/frontend/src/app/page.tsx\n"
        "--- a/frontend/src/app/page.tsx\n"
        "+++ b/frontend/src/app/page.tsx\n"
        "@@ -1,2 +1,3 @@\n"
        "+// frontend change\n"
    )
    partitions = reviewer.partition_diff_by_domain(sample_diff)
    assert "backend/app/api/v1/endpoints/auth.py" in partitions["backend"]
    assert "frontend/src/app/page.tsx" not in partitions["backend"]
    assert "frontend/src/app/page.tsx" in partitions["frontend"]
    assert "backend/app/api/v1/endpoints/auth.py" not in partitions["frontend"]
    assert partitions["mobile"] == ""

    be_rules = reviewer.read_domain_review_rules("backend")
    fe_rules = reviewer.read_domain_review_rules("frontend")
    assert "be-code-review" in be_rules
    assert "fe-code-review" in fe_rules

    assert reviewer.has_blocking_verdict("### 🎯 Verdict: CHANGES REQUESTED 🛑") is True
    assert reviewer.has_blocking_verdict("### 🎯 Verdict: PASS ✅") is False


def test_ai_pm_manager_enforces_canonical_kanban_roles_and_board_ids():
    """Verify ai-pm-manager registers Design/BE/FE/Mobile/Architect roles (no standalone QC Todo) and Kanban IDs."""
    pm = _load_script("ai-pm-manager.py")
    assert pm.ROLES == {"design", "backend", "frontend", "mobile", "architect"}
    assert pm.KANBAN_PROJECT_ID == "PVT_kwHOAeXQP84BoMSn"
    assert pm.KANBAN_TODO_OPTION_ID == "b5bd229a"


def test_architect_counter_audit_gates_locked_in_ratchet_and_trust_benchmark():
    """BEL-240: Verify NTA-P004 dead endpoint constants, NTA-C004 static inline styles, and nested <main> are locked at 0."""
    import subprocess

    proc = subprocess.run(
        [sys.executable, "-I", "-S", str(ROOT_DIR / "scripts" / "ratchet.py")],
        capture_output=True,
        text=True,
        encoding="utf-8",
        check=False,
    )
    assert proc.returncode == 0
    assert "WORSE" not in proc.stdout
    assert "FAIL" not in proc.stdout


