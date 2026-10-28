---
name: investigate
description: >-
  Forensic read-only codebase investigation, root-cause tracing, 2-option trade-off analysis (Ponytail vs Full), and stateful planning into .agents/STATE.md without modifying source code. Use when the user invokes /investigate or asks to investigate a bug, design a feature plan, or trace architecture before coding. Not for executing code edits directly.
argument-hint: "[bug | feature | target-module]"
---

# Forensic Investigation & Adversarial Planning (`/investigate`)

> **Iron Rule (READ-ONLY LOCK):** When `/investigate` is active, you are **STRICTLY FORBIDDEN** from editing any file in `backend/`, `frontend/`, or `qc/`. Your sole allowed write target is `.agents/STATE.md` (<= 50 lines).

---

## 1. Phase 1: Forensic Call-Graph Trace (Zero Guessing)

Before proposing any plan, trace the exact execution path end-to-end:
1. **Knowledge & State Lookup:**
   - Query `graphify` (`query_graph` / `get_node` if available) -> `CURRENT_STATE.md` -> `.agents/PRODUCT_THESIS.md` -> target Domain `SKILL.md`.
   - If the investigation spans > 5 files, delegate a read-only survey to a subagent so the main context stays clean (Claude Code: the `investigator` agent in `.claude/agents/investigator.md`).
2. **End-to-End Symbol Pinpointing:**
   - Trace the exact chain with file paths and line numbers:
     `UI Component / Page` $\rightarrow$ `Custom Hook` $\rightarrow$ `FastAPI Router` $\rightarrow$ `Service` $\rightarrow$ `Repository` $\rightarrow$ `PostgreSQL Table`.
   - If investigating a UI issue, check `legacy/` (or `$LEGACY_DIR` if set) and `docs/VIOLATIONS_REGISTER.md` first.

---

## 2. Phase 2: Adversarial Supervisor Challenge (`belooga-supervisor`)

Never rubber-stamp the user's initial assumption. Challenge the request across 3 questions:
1. **Root Cause vs. Symptom:** Is the user asking to patch a symptom while the real bug lives in a shared hook/service/schema?
2. **YAGNI & Business ROI:** Can 50% of the proposed scope be eliminated without hurting Candidate/Recruiter value?
3. **Blast Radius & Failure Modes:** What breaks under concurrent requests, row locks (`with_for_update`), async event loop (`asyncio.to_thread`), IDOR checks, or CSS specificity?

---

## 3. Phase 3: The 2-Option Trade-Off Matrix

Always present **two concrete engineering options** so the user can make an informed decision:

| Dimension | Option A: Ponytail Minimal (Recommended) | Option B: Full Structural |
|---|---|---|
| **Approach** | Shortest path reusing stdlib/existing helpers (e.g. <= 50 lines). | Comprehensive refactor or new module/table. |
| **Files Touched** | Exact list of files & line ranges. | Exact list of files & migrations. |
| **Risks & Ceiling** | What ceiling does this hit later? | Higher blast radius / token cost. |

State clearly which option you recommend as Supervisor and why.

---

## 4. Phase 4: Persist into `.agents/STATE.md` & HALT

1. Overwrite `.agents/STATE.md` (strictly <= 50 lines) with:
   - `Objective & Hypothesis`
   - `Pre-Mortem Risks`
   - `Target Files`
   - `Execution Checklist ([ ] Step 1: Red test, [ ] Step 2: Green fix, [ ] Step 3: Trust Benchmark)`
2. **HALT IMMEDIATELY (<= 8 Lines Total):** Output an ultra-short summary (1-line Root Cause + 1-line Option A + 1-line Option B) and ask: *"Chọn Option A hay Option B?"* Do not touch source code until approved.
