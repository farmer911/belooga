---
trigger: always_on
description: Core anti-hallucination and ground-truth invariants for Belooga.
---

# Legacy System Ground-Truth & Anti-Hallucination Harness Rules

1. **Zero Hallucination Policy:** NEVER hallucinate, approximate, or draw SVG/UI assets when working with legacy codebases.
2. **Literal Asset Provenance:** ALWAYS extract exact assets, class names, and layout styles from the read-only in-repo `legacy/` directory (or `$LEGACY_DIR` if set to an upstream `farmer911/beloga` checkout).
3. **Violations Register Consultation:** Check `docs/VIOLATIONS_REGISTER.md` to prevent repeating past mistakes.
4. **Zero Global CSS Pollution:** Scoped strictly per `.agents/skills/engineering-integrity-and-evidence/SKILL.md` §4. Never assign dimensions to generic trigger classes.
5. **Mandatory Interactive & Visual Verification Gate:** Before declaring ANY UI fix or interactive feature (hover, click, modal, dropdown) as complete, the agent MUST inspect the live page in the browser. NEVER claim a fix is complete based only on code edits.
6. **When to Ask (single policy for every agent and mode):** Never guess or fabricate an asset, style, API contract, schema, or business rule. First look it up (code -> `CURRENT_STATE.md` -> `.agents/PRODUCT_THESIS.md` -> domain `SKILL.md` -> `legacy/`). If it is still undocumented and the choice changes behaviour users or other code depend on, ask:
   - **Interactive session:** stop that part of the work and ask the user in chat.
   - **Autonomous Kanban mode (no human in the loop):** post the question as a comment on the GitHub issue, leave the ticket in its column, and move on to other actionable work; never invent the contract to keep going.
   For anything else (naming, internal structure, which stdlib helper to use) state the assumption in one line and proceed; do not ask.
7. **Execution Integrity:** Follow `GEMINI.md` and abide by `.agents/skills/engineering-integrity-and-evidence/SKILL.md`. Adhere strictly to the "No Proof = Not Done" rule.
8. **SSOT Ground-Truth Consultation:** Always consult `CURRENT_STATE.md` (the dynamically generated ground truth from AST and PostgreSQL schemas). Never cite or invent unverified table names, route paths, or package versions.
9. **Definition of Done:** Complete `.agents/workflows/definition-of-done.md` before declaring completion (it runs `bash scripts/audit-truth.sh`: schema drift, unindexed search fallbacks, blocking calls in async code, backend pytest).
10. **Mandatory TDD Workflow:** Follow `.agents/skills/tdd-workflow/SKILL.md`. Always produce and record a failing test (Red phase) before writing or modifying code.
