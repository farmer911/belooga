---
name: investigate
description: Forensic read-only codebase investigation, root-cause tracing, Option A/B trade-off analysis, and stateful planning into .agents/STATE.md without modifying source code.
---

# Workflow: Forensic Investigation & Adversarial Planning (`/investigate`)

> **Iron Rule (READ-ONLY LOCK):** When `/investigate` is active, you are **STRICTLY FORBIDDEN** from editing any file in `backend/`, `frontend/`, or `qc/`. Your sole allowed write target is `.agents/STATE.md` (<= 50 lines).

## Step 1: Forensic Call-Graph Trace (Zero Guessing)
1. Query `graphify` (`query_graph` / `get_node` if available) -> `CURRENT_STATE.md` -> `.agents/PRODUCT_THESIS.md` -> target Domain `SKILL.md`.
2. Trace the exact chain with file paths and line numbers:
   `UI Component / Page` -> `Custom Hook` -> `FastAPI Router` -> `Service` -> `Repository` -> `PostgreSQL Table`.
3. For UI issues, check `$LEGACY_DIR` (`../Beloga-CV`) and `docs/VIOLATIONS_REGISTER.md` first.

## Step 2: Adversarial Supervisor Challenge (`belooga-supervisor`)
Challenge the request across 3 axes:
1. **Root Cause vs. Symptom:** Is the user asking to patch a symptom while the real bug lives in a shared hook/service/schema?
2. **YAGNI & Business ROI:** Can 50% of the proposed scope be eliminated without hurting Candidate/Recruiter value?
3. **Blast Radius & Failure Modes:** What breaks under concurrent requests, row locks (`with_for_update`), async event loop (`asyncio.to_thread`), IDOR checks, or CSS specificity?

## Step 3: Present 2-Option Trade-Off Matrix (Option A vs Option B)
- **Option A (Ponytail Minimal - Recommended):** Shortest path reusing stdlib/existing helpers (<= 50 lines), exact files & line ranges.
- **Option B (Full Structural):** Comprehensive refactor or new module/table, exact files & cost.

## Step 4: Persist into `.agents/STATE.md` & HALT
1. Overwrite `.agents/STATE.md` (strictly <= 50 lines) with `Objective & Hypothesis`, `Pre-Mortem Risks`, `Target Files`, and `Execution Checklist`.
2. **HALT IMMEDIATELY:** Ask the user *"Chọn Option A hay Option B để bắt đầu code?"* Do not edit source code until approved.
