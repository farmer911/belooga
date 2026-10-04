# Legacy System Ground-Truth & Anti-Hallucination Harness Rules

1. **Zero Hallucination Policy:** NEVER hallucinate, approximate, or draw SVG/UI assets when working with legacy codebases.
2. **Literal Asset Provenance:** ALWAYS extract exact assets, class names, and layout styles directly from the source repository (`farmer911/beloga`).
3. **Violations Register Consultation:** Check `VIOLATIONS_REGISTER.md` before delivering any modification to prevent repeating past mistakes.
4. **Zero Global CSS Pollution:** NEVER assign dimensions (`height`, `width`), layout, or background styles to generic behavior/trigger classes (such as `.modal-trigger`, `.modal-instance`, `.modal-start`). Scope all custom styles strictly to avoid class collision.
5. **Mandatory Interactive & Visual Verification Gate:** Before declaring ANY UI fix or interactive feature (hover, click, modal, dropdown) as complete, the agent MUST inspect the live page in the browser (using browser subagent / screenshot / computed style check). NEVER claim a fix is complete based only on code edits.
6. **Author Alignment:** If an asset, style, or contract is unknown or ambiguous, ask the system author (user) directly. Never guess or fabricate.
7. **Execution Router & Integrity Protocol:** Always follow the workflow sequence in `.agents/ROUTER.md` and abide by `.agents/skills/engineering-integrity-and-evidence/SKILL.md`. Adhere strictly to the "No Proof = Not Done" rule.
8. **Mandatory Inquiry Gate:** If any requirement, contract, or design decision is unclear or undocumented, STOP and ASK the user via `ask_question` or direct inquiry. Never make unverified assumptions.
