---
description: Read-only forensic investigation with Option A/B plan written to .agents/STATE.md, then halt.
argument-hint: "[bug | feature | target-module]"
---

Run the canonical workflow below for: $ARGUMENTS

For a survey spanning more than 5 files, delegate it to the `investigator` subagent (`.claude/agents/investigator.md`); its tool list cannot edit files, which enforces the READ-ONLY LOCK. Only `.agents/STATE.md` may be written, by you, at the end.

@.agents/workflows/investigate.md
@.agents/skills/investigate/SKILL.md
