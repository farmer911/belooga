---
name: ponytail-audit
description: >
  Whole-repo audit for over-engineering. Scans the codebase for what to delete,
  simplify, or replace with stdlib/native equivalents. Use when the user says
  "audit this codebase", "audit for over-engineering", "what can I delete from this repo",
  "find bloat", "ponytail-audit", or "/ponytail-audit". One-shot report, does not apply fixes.
---

# Ponytail Repository Audit

Whole-tree audit for unnecessary complexity and bloat.

## Exclusions
Never audit or propose deletions in:
- `legacy/`: Strictly READ-ONLY historical parity source.
- `graphify-out/`: Dynamically generated knowledge graph artifacts.
- `<!-- AUTO:BEGIN -->` blocks: Machine-generated domain facts.
- Virtual environments (`.venv/`) and package locks (`node_modules/`, `bun.lock`).

## Hunt Tags
- `delete:` dead code, unused flexibility, speculative feature. Replacement: nothing.
- `stdlib:` hand-rolled code that Python or Web standards ship. Name the function.
- `native:` dependency or code doing what the platform already does. Name the feature.
- `reuse:` equivalent helper, util, or pattern already in this repo. Name the path.
- `yagni:` abstraction with one implementation, config nobody sets.
- `shrink:` same logic, fewer lines. Show the shorter form.

## Output
One line per finding, ranked by impact: `<tag> <what to cut>. <replacement>. [path]`.
End with `net: -<N> lines, -<M> deps possible.`
