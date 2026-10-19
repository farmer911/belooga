"""
Deterministic Production UI/UX, Design System Token & Responsive Guard Tests.
Verifies zero arbitrary hexes, zero structural emojis, semantic @theme token usage
in UI primitives & layout, mobile 375px navigation drawer, and agent skill knowledge sync.
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
FE_SRC = ROOT / "frontend" / "src"
AGENTS = ROOT / ".agents"

HEX_CLASS_RE = re.compile(r"\[#[0-9a-fA-F]{3,8}\]")
EMOJI_RE = re.compile(r"[\U0001F300-\U0001FAFF\u2600-\u26FF]")


def test_zero_arbitrary_hex_across_frontend():
    """All frontend TSX files must use @theme semantic tokens instead of arbitrary [#hex] classes."""
    offenders = []
    for f in sorted(FE_SRC.rglob("*.tsx")):
        matches = HEX_CLASS_RE.findall(f.read_text(encoding="utf-8"))
        if matches:
            offenders.append(f"{f.relative_to(ROOT)} ({len(matches)}: {matches[:3]})")
    assert not offenders, f"Found arbitrary hex classes in {len(offenders)} files:\n" + "\n".join(offenders[:15])


def test_zero_structural_emojis_across_frontend():
    """All frontend TSX files must use lucide-react vector SVG icons instead of structural emojis."""
    offenders = []
    for f in sorted(FE_SRC.rglob("*.tsx")):
        matches = EMOJI_RE.findall(f.read_text(encoding="utf-8"))
        if matches:
            offenders.append(f"{f.relative_to(ROOT)} ({len(matches)}: {matches[:3]})")
    assert not offenders, f"Found structural emojis in {len(offenders)} files:\n" + "\n".join(offenders[:15])


def test_ui_primitives_and_layout_use_semantic_tokens():
    """Core UI primitives and global layout components must use semantic surface/typography/brand tokens."""
    core_files = [
        FE_SRC / "components" / "ui" / "button.tsx",
        FE_SRC / "components" / "ui" / "card.tsx",
        FE_SRC / "components" / "ui" / "input.tsx",
        FE_SRC / "components" / "ui" / "dialog.tsx",
        FE_SRC / "components" / "ui" / "badge.tsx",
        FE_SRC / "components" / "layout" / "Header.tsx",
        FE_SRC / "components" / "layout" / "Footer.tsx",
        FE_SRC / "components" / "layout" / "ecosystem-menu.tsx",
        FE_SRC / "components" / "common" / "theme-toggle.tsx",
    ]
    for path in core_files:
        txt = path.read_text(encoding="utf-8")
        assert not re.search(r"\bbg-white\b", txt), f"{path.name} hardcodes bg-white instead of bg-surface-card"
        assert not HEX_CLASS_RE.search(txt), f"{path.name} contains arbitrary hex notation"


def test_header_has_responsive_mobile_menu_toggle():
    """Header must provide an accessible mobile navigation toggle and drawer for 375px viewports."""
    header_txt = (FE_SRC / "components" / "layout" / "Header.tsx").read_text(encoding="utf-8")
    assert 'data-testid="mobile-menu-toggle"' in header_txt
    assert 'data-testid="mobile-nav-drawer"' in header_txt


def test_ratchet_and_agent_skills_encode_design_system_knowledge():
    """Ratchet baseline and frontend skills must lock in 0 arbitrary hexes, 0 emojis, and token mapping."""
    ratchet = json.loads((AGENTS / "ratchet.json").read_text(encoding="utf-8"))
    assert ratchet.get("fe_arbitrary_hex") == 0
    assert ratchet.get("fe_structural_emoji") == 0

    fe_skill = (AGENTS / "skills" / "belooga-frontend-engineering" / "SKILL.md").read_text(encoding="utf-8")
    assert "--surface-card" in fe_skill or "bg-surface-card" in fe_skill
    assert "375px" in fe_skill
    assert "lucide-react" in fe_skill


def test_no_mistakes_gate_and_evidence_invariants():
    """Verify no-mistakes upgrades: video/screenshot on pass, pre-push gate, source-grep test guard, and adversarial review rules."""
    pw_cfg = (ROOT / "qc" / "playwright.config.ts").read_text(encoding="utf-8")
    assert "screenshot: 'on'" in pw_cfg
    assert "video: 'on'" in pw_cfg

    pre_push = ROOT / "scripts" / "pre-push-gate.sh"
    assert pre_push.exists(), "scripts/pre-push-gate.sh must exist"

    tb_txt = (ROOT / "scripts" / "trust-benchmark.py").read_text(encoding="utf-8")
    assert "source-content-only" in tb_txt

    for skill_name in ("be-code-review", "fe-code-review"):
        skill_txt = (AGENTS / "skills" / skill_name / "SKILL.md").read_text(encoding="utf-8")
        assert "Fix by Invariant" in skill_txt
        assert "Simplification Pass" in skill_txt
        assert "Independent Reviewer" in skill_txt

