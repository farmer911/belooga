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

2. **Proof = a command anyone can re-run, not pasted text:**
   - One line per gate you actually ran: `command` -> exit code (e.g. `pytest backend/tests/ -q` -> 0).
   - A gate you could not run (no DB, no browser, no `gh`) is reported as `not run: <reason>`, never as passed.
   - Never paste, paraphrase or reconstruct output; a chat log is self-reported and can be fabricated. The PR's CI run is the source of truth.

3. **The gate is tested too:** `scripts/trust-benchmark.py` must report every planted cheat in `.agents/evals/trust-probes/` (`backend/tests/test_trust_benchmark_probes.py`). Found a new way to fake a pass? Add a probe first, then teach the benchmark.

---

## 2. Pillar 2: Mandatory Inquiry Protocol (Uncertainty = Mandatory Question)

1. **Never fabricate; ask per one policy:** `.agents/rules/anti-hallucination-harness.md` rule 6 decides when to stop and ask (contracts, schemas, business rules users depend on) and when to state a one-line assumption and proceed (naming, internal structure).
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
   - Always extract exact assets, class names, and layout styles directly from the read-only in-repo `legacy/` (or `$LEGACY_DIR` if set to an upstream checkout).
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
