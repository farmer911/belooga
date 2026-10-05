---
name: engineering-integrity-and-evidence
description: Mandatory core engineering integrity protocol enforcing zero-hallucination, absolute honesty, empirical proof-of-work, proactive inquiry, and legacy ground truth parity. Use on every task before claiming completion, when unsure about a contract, or when touching legacy parity.
---

# Mandatory Core Engineering Integrity & Evidence Protocol

> **Scope:** UNIVERSAL & MANDATORY FOR ALL AGENTS IN BELOOGA  
> **Rule:** Every agent interacting with this repository MUST adhere to these pillars. Zero tolerance for dishonesty, fake completion, or hallucinations.

---

## 1. Pillar 1: The "No Proof = Not Done" Iron Rule

1. **Zero False Completion:**
   - It is strictly forbidden to claim a task or bug fix is done without running verified tests and providing command output (`No Proof = Not Done`).
   - Never claim completion based solely on code edits. You must execute tests or inspect live browser pages.
   - Any claim of completion lacking accompanying empirical execution logs is classified as a Level-1 Integrity Violation.

2. **Mandatory Proof Block:**
   Whenever concluding a task, the agent must provide an empirical proof block containing the exact command, exit code, and unedited output:
   ```markdown
   ### 🧾 Empirical Proof of Work
   - Command: `bun run test:e2e` / `pytest backend/tests/`
   - Exit code: `0`
   - Log snippet (last 5 lines verbatim):
     ```
     [Paste literal 5 lines of terminal output here without summarizing]
     ```
   ```

---

## 2. Pillar 2: Mandatory Inquiry Protocol (Uncertainty = Mandatory Question)

1. **Never Guess, Always Clarify:**
   - When encountering missing specifications, ambiguous business requirements, undefined API schemas, or uncertain database columns:
     - ❌ **NEVER ASSUME OR FABRICATE** requirements to keep moving.
     - ✅ **HALT EXECUTION IMMEDIATELY** and ask the user directly for clarification.
2. **Inquiry Format:** State what is missing, the risk of guessing, and concrete options for the user to decide.

---

## 3. Pillar 3: Zero Full-Stack Hallucination & Blacklist

1. **Frontend Guardrails:**
   - Never synthesize vector math or approximate custom SVGs when legacy assets exist.
   - Never invent component props without checking the underlying TypeScript interface definition.
2. **Backend Guardrails:**
   - Never invent arbitrary API endpoint paths (`/v1/...`) that do not exist in backend routers.
   - Never invent column names in PostgreSQL queries that are absent from models or `initdb.sql`.
   - Never return untyped dictionary shapes that deviate from Pydantic DTO contracts.
3. **Blacklist of Deceptive Behaviors:**
   - ❌ **Typecheck Cheating:** Using `as any`, `@ts-ignore`, or `# type: ignore` to suppress compiler diagnostics.
   - ❌ **Test Cheating:** Commenting out assertions, deleting test cases, or appending `.skip` to bypass failures.
   - ❌ **Silent Error Swallowing:** Wrapping broken logic in empty `try ... catch {}` blocks without recovery.

---

## 4. Legacy Parity & Anti-Pollution (Sole Authoritative Source)

1. **Literal Asset Provenance:**
   - Always extract exact assets, class names, and layout styles directly from `$LEGACY_DIR` (configured in `.env.example`, default `../Beloga-CV`).
   - If an asset is unavailable or corrupt, state explicitly: *"The asset `<path>` is missing from the repository."* Ask the user to provide it.
2. **Zero Global CSS Pollution:**
   - NEVER assign dimensions (`height`, `width`), layout, or background styles to generic behavior/trigger classes (such as `.modal-trigger`, `.modal-instance`, `.modal-start`).
   - Scope all custom styles tightly under their parent component container to prevent cascade collisions.
3. **Mandatory Interactive & Visual Verification Gate:**
   - Before declaring ANY UI fix or interactive feature (hover, click, modal, dropdown) complete, inspect the live page in the browser. Verify computed geometry without distortion.
4. **Violations Register Consultation:**
   - Check `docs/VIOLATIONS_REGISTER.md` to prevent repeating past mistakes.

---

## 5. Radical Transparency & Incident Reporting

If an automated test fails, or if a change introduces a regression, report the exact truth immediately with error logs, root cause analysis, and remediation steps.
