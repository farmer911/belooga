---
name: ponytail-review
description: >
  Code review focused exclusively on over-engineering. Finds what to delete:
  reinvented standard library, unneeded dependencies, speculative abstractions,
  dead flexibility. Use when the user says "review for over-engineering",
  "what can we delete", "is this over-engineered", "simplify review", or invokes
  /ponytail-review. Not for correctness, IDOR, or security review (be-code-review, fe-code-review).
---

# Ponytail Code Review

Review diffs for unnecessary complexity. One line per finding: location, what to cut, what replaces it. The diff's best outcome is getting shorter.

## Format
`L<line>: <tag> <what>. <replacement>.`, or `<file>:L<line>: ...` for multi-file diffs.

Tags:
- `delete:` dead code, unused flexibility, speculative feature. Replacement: nothing.
- `stdlib:` hand-rolled thing the standard library ships. Name the function.
- `native:` dependency or code doing what the platform already does. Name the feature.
- `reuse:` equivalent helper, util, or pattern already in this repo. Name the path.
- `yagni:` abstraction with one implementation, config nobody sets, layer with one caller.
- `shrink:` same logic, fewer lines. Show the shorter form.

## Belooga Examples
✅ `services/media_service.py:L45: stdlib: custom uuid string formatter. Use str(uuid), 1 line.`
✅ `components/features/search/search-bar.tsx:L12: native: external debounce package. Custom 5-line setTimeout hook, 0 dependencies.`
✅ `api/v1/endpoints/timeline.py:L34: reuse: duplicate ownership check. Call verify_profile_owner(current_user, target_username).`

## Scoring
End with: `net: -<N> lines possible.`
If there is nothing to cut, say `Lean already. Ship.` and stop.

## Boundaries
Scope: over-engineering and complexity only. Correctness bugs, security vulnerabilities (IDOR, SQL injection, event-loop blocking) must be reviewed via `be-code-review` and `fe-code-review`.
