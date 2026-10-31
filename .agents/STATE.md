# Active Working Memory (.agents/STATE.md)

🎯 Đang làm ticket: [BEL-247] (#257) — Nạp Kiến Thức System Design Primer & Primer 3-Tier Token SSOT Vào BE Review, FE Review & QC Agents | Role: Architect / Supervisor | Cột: In Progress

## Hypothesis & Architectural Scope
1. **RED Phase (`writing-skills` + TDD):**
   - Baseline failure: Without explicit Primer gates & Rationalization Prevention tables in `be-code-review/SKILL.md`, `fe-code-review/SKILL.md`, `belooga-qc-engineering/SKILL.md`, and `scripts/ai-code-reviewer.py`, reviewer/QC agents rationalize bypassing `get_read_db`, cross-pod Pub/Sub L1 invalidation, `tokens/design-tokens.json` 3-tier token sync, or `mobile_unused_hooks: 0`.
2. **GREEN & REFACTOR Phase:**
   - Upgrade `be-code-review/SKILL.md`, `fe-code-review/SKILL.md`, `belooga-qc-engineering/SKILL.md`, `belooga-backend-engineering/SKILL.md`, `belooga-frontend-engineering/SKILL.md`, and `scripts/ai-code-reviewer.py`.
   - Sync `.claude/skills/` via `python3 scripts/sync-claude-skills.py` and verify `python3 scripts/lint-skills.py --quiet` exits `0`.

## Execution Checklist
- [x] RED: Add failing test in `backend/tests/test_bel246_primer_system_and_design_tokens.py` and run baseline pressure scenario
- [x] Verify RED: Run `pytest` and confirm failure before editing skills
- [x] GREEN: Update `be-code-review`, `fe-code-review`, `belooga-qc-engineering`, `belooga-backend-engineering`, `belooga-frontend-engineering`, and `scripts/ai-code-reviewer.py`
- [x] REFACTOR: Sync `.claude/skills` (`sync-claude-skills.py`), run `lint-skills.py`, `trust-benchmark.py`, `pytest`
- [x] Merge PR & move #257 to Done
