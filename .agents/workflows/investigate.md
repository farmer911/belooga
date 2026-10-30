---
name: investigate
description: Forensic read-only codebase investigation, root-cause tracing, Option A/B trade-off analysis, and stateful planning into .agents/STATE.md without modifying source code.
---

# Workflow: Forensic Investigation & Adversarial Planning (`/investigate`)

Follow `.agents/skills/investigate/SKILL.md` end to end; it holds the READ-ONLY LOCK and all four phases (trace -> supervisor challenge -> Option A/B -> persist to `.agents/STATE.md` and halt).

Claude Code: `/investigate` (`.claude/commands/investigate.md`) can hand the survey to the `investigator` subagent (`.claude/agents/investigator.md`), whose tool list enforces the lock.
