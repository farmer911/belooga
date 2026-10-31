# Active Stateful Working Memory (.agents/STATE.md)

## Active Task: `[BEL-249]` — Roll out System Design Primer & Primer 3-Tier Design Token SSOT across all 10 remaining Role & Domain Skills
- **Hypothesis:** Codifying `tokens/design-tokens.json` (`sync-design-tokens.py --check`) and System Design Primer (`get_read_db`, `invalidate_candidate_cache`, zero `text(f"...")`) across all 10 remaining role/domain skills (`ui-ux-pro-max`, `belooga-senior-agile-workflow`, `belooga-supervisor`, `fe-domain-*`, `be-domain-*`, `definition-of-done`) + `.agents/workflows/definition-of-done.md` ensures 100% of agents follow Primer standards.
- **Risks:**
  1. Verified every `SKILL.md` stays `<= 200` lines with zero `COUNT_RE` violations (`scripts/lint-skills.py` exits `0`).
  2. Verified `.claude/skills/` mirror and `AUTO` blocks remain 100% in sync.

## Execution Checklist (TDD: RED -> Verify RED -> GREEN -> Verify GREEN -> REFACTOR)
- [x] 1. **RED Phase:** Extended `test_be_fe_qc_review_agents_and_skills_enforce_primer_contracts` in `backend/tests/test_bel246_primer_system_and_design_tokens.py` and verified failure (`pytest`).
- [x] 2. **GREEN — Design, PM, Architect & Supervisor Skills:** Updated `ui-ux-pro-max/SKILL.md`, `belooga-senior-agile-workflow/SKILL.md`, and `belooga-supervisor/SKILL.md`.
- [x] 3. **GREEN — 3 FE Domain & 3 BE Domain Skills:** Updated `fe-domain-{public,workspace,career-tools}/SKILL.md` and `be-domain-{core,discovery,monetization}/SKILL.md`.
- [x] 4. **GREEN — DoD Skill, Workflow & Benchmark Gate:** Updated `definition-of-done/SKILL.md`, `.agents/workflows/definition-of-done.md`, and `scripts/trust-benchmark.py`.
- [x] 5. **Verify & Deliver:** Run `sync-design-tokens.py --check`, `lint-skills.py --quiet`, `trust-benchmark.py`, and `pytest`.
