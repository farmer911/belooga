---
name: ponytail-debt
description: >
  Harvest every `ponytail:` comment in the codebase into a debt ledger, so the
  deliberate shortcuts and deferrals ponytail leaves behind get tracked instead
  of rotting into "later means never". Use when the user says "ponytail debt",
  "/ponytail-debt", "what did ponytail defer", "list the shortcuts", "ponytail
  ledger", or "what did we mark to do later". One-shot report, changes nothing.
---

# Ponytail Technical Debt Ledger

Collects all intentional shortcuts into one ledger.

## Scan Command
```bash
grep -rnE --exclude-dir=.git --exclude-dir=node_modules --exclude-dir=legacy --exclude-dir=graphify-out --exclude-dir=.venv '(#|//|/[*]) ?ponytail:' .
```

## Output Destination
When persisting the ledger, write to `docs/ponytail-debt.md`:
`<file>:<line>, <what was simplified>. ceiling: <limit named>. upgrade: <trigger to revisit>.`

Flag any marker that names no upgrade path with `[no-trigger]`.
End with `<N> markers, <M> with no trigger.`
