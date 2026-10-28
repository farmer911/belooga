@GEMINI.md
@.agents/rules/anti-hallucination-harness.md
@.agents/ROUTER.md

# Claude Code notes

- `GEMINI.md` above is the shared always-on contract; `.agents/` is the canonical agent layer for Gemini/Antigravity and Claude Code alike.
- **Path-scoped rules** live in `.agents/rules/` and are not auto-loaded: read the matching file before touching those paths (`backend.md` -> `backend/**`, `frontend.md` -> `frontend/**`, `qc.md` -> `qc/**`, `legacy.md` -> `legacy/**`). `ponytail.md` is always on; `graphify.md` and `headroom.md` apply when those tools exist.
- **Skills:** `.claude/skills/<name>/SKILL.md` are generated stubs pointing at `.agents/skills/<name>/SKILL.md`. Edit the canonical skill, then run `python3 scripts/sync-claude-skills.py` (`scripts/lint-skills.py` fails when they drift).
- **Commands:** `/investigate`, `/definition-of-done`, `/schema-change`, `/visual-verify` import the canonical `.agents/workflows/*.md`.
- **Subagent:** `investigator` (`.claude/agents/investigator.md`) is read-only by tool permissions; use it for wide /investigate surveys.
- `.claude/worktrees/` holds agent worktrees and is gitignored.
