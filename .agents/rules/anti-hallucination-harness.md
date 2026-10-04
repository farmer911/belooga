---
trigger: always_on
description: Core anti-hallucination and ground-truth invariants for Belooga.
---

# Legacy System Ground-Truth & Anti-Hallucination Harness Rules

1. **Zero Hallucination Policy:** NEVER hallucinate, approximate, or draw SVG/UI assets when working with legacy codebases.
2. **Literal Asset Provenance:** ALWAYS extract exact assets, class names, and layout styles directly from the source repository `farmer911/beloga` (located locally at `/Users/phucnguyen/Dev/Beloga-CV` or `../Beloga-CV`).
3. **Violations Register Consultation:** Check `docs/archive/VIOLATIONS_REGISTER.md` to prevent repeating past mistakes.
4. **Zero Global CSS Pollution:** NEVER assign dimensions (`height`, `width`), layout, or background styles to generic behavior/trigger classes (such as `.modal-trigger`, `.modal-instance`, `.modal-start`). Scope all custom styles strictly to avoid class collision.
5. **Mandatory Interactive & Visual Verification Gate:** Before declaring ANY UI fix or interactive feature (hover, click, modal, dropdown) as complete, the agent MUST inspect the live page in the browser. NEVER claim a fix is complete based only on code edits.
6. **Author Alignment:** If an asset, style, or contract is unknown or ambiguous, ask the system author (user) directly. Never guess or fabricate.
7. **Execution Integrity:** Follow `GEMINI.md` and abide by `.agents/skills/engineering-integrity-and-evidence/SKILL.md`. Adhere strictly to the "No Proof = Not Done" rule.
8. **Mandatory Inquiry Gate:** If any requirement, contract, or design decision is unclear or undocumented, STOP and ASK the user via direct inquiry. Never make unverified assumptions.
9. **SSOT Ground-Truth Consultation:** Always consult `CURRENT_STATE.md` (the dynamically generated ground truth from AST and PostgreSQL schemas). Never cite or invent unverified table names, route paths, or package versions.
10. **Automated SSOT Integrity Gate:** Run `bash scripts/audit-truth.sh` before declaring completion. It verifies zero schema drift, zero unindexed search fallbacks, zero blocking calls in async event loop, and executes the backend pytest suite.
11. **Mandatory TDD Workflow:** Follow `.agents/skills/tdd-workflow/SKILL.md`. Always produce and record a failing test (Red phase) before writing or modifying code.
