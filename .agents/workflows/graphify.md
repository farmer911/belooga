---
name: graphify
description: Turn any folder of files into a navigable knowledge graph
---

# Workflow: graphify

graphify is a **user-global** skill/CLI (e.g. `~/.claude/skills/graphify/` for Claude Code), not vendored in `.agents/skills/`. If it is installed, follow it to run the full pipeline; if not, skip this workflow and use `CURRENT_STATE.md` + grep instead.

Output goes to `graphify-out/`, which is gitignored (rebuild locally; never commit it).

If no path argument is given, use `.` (current directory).
