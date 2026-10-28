---
trigger: always_on
description: Ponytail minimalism is always on for every code change in Belooga; the full ladder lives in the ponytail skill.
---

# Ponytail (always on)

**Policy:** every code change applies the ponytail ladder by default, without being invoked and without asking permission. The ladder, rules and output format are in `.agents/skills/ponytail/SKILL.md`; this file only sets the policy and the project overrides. `ponytail-review`, `ponytail-audit` and `ponytail-debt` are on-demand reports, not modes.

## Project Overrides
Belooga's clean layered architecture (router -> service -> repository) and ratchet metrics recorded in `.agents/ratchet.json` are project invariants and are **NOT** considered over-engineering. Do not flatten layers or discard type safety in the name of ponytail.

## Vendored copies
The four `ponytail*` skills under `.agents/skills/` duplicate the upstream ponytail plugin on purpose: Gemini/Antigravity cannot load Claude Code plugins. Keep the Project Overrides section in sync when re-vendoring.
