---
name: belooga-self-learn
description: Turn mistakes, user corrections, and newly uncovered invariants into lasting architectural and quality fixes. Routes lessons into VIOLATIONS_REGISTER.md, agent rules, QC assertions, or audit scripts. Use when a bug is fixed, when the user corrects an approach, or at session wrap-up. Triggers: "rút kinh nghiệm", "học từ lỗi này", "nhớ lần sau", "lần sau đừng", "self-learn", "cập nhật rule", "ghi nhận bài học".
---

# 🧠 Belooga Self-Learn & Engineering Retrospective

> **Core Philosophy:** *A mistake corrected in chat but not codified into harness rules, tests, or scripts will happen again.*
> Never rely on memory. Every mistake or user correction must be turned into an automated assertion, a harness rule, or a registered violation.

---

## 1. When to Trigger Self-Learn

Run this workflow:
1. **Immediately after a bug or regression is solved:** Once the root cause is proven and verified via tests. Never interrupt in the middle of diagnosing.
2. **When the user issues a correction:** E.g., *"Lần sau nhớ làm thế này"*, *"Đừng tự ý vẽ SVG nữa"*, *"Quy tắc là phải kiểm tra hover trước"*.
3. **At session wrap-up:** Sweep recent interactions to check if any architectural insight or invariant was uncovered.

---

## 2. The 3-Step Lesson Formula

Always structure the recorded lesson into three empirical components:

$$\text{Symptom (Biểu hiện)} \longrightarrow \text{Root Cause (Nguyên nhân)} \longrightarrow \text{Harness Guard (Rào cản vĩnh viễn)}$$

| Component | Description | Example |
|---|---|---|
| **1. Symptom** | The exact observed failure with error logs, dimensions, or user feedback. | Play button rendered as a 54px × 240px black ellipse on card hover. |
| **2. Root Cause** | The deep technical reason (CSS collision, blocking async I/O, unindexed query, missing guard). | Class `.modal-trigger` had global layout styles in CSS, colliding with `.video-play-icon`. |
| **3. Harness Guard** | Concrete, automated barrier preventing recurrence (test assertion, bash audit, rule lock). | Added TC-VIS-003 to `qc/tests/visual/play-button.spec.ts` and locked in harness rules. |

---

## 3. Destination Routing Matrix

Categorize the lesson and route it to the exact single source of truth:

| Lesson Category | Target File | Action Required |
|---|---|---|
| **Severe Hallucination / UI Distortion / Repeated Mistake** | `docs/archive/VIOLATIONS_REGISTER.md` | Append a new entry `[VIOLATION-XXX]` with Symptom, Root Cause, Remediation, and Status. |
| **Global Agent Boundary / Prohibition** | `.agents/rules/anti-hallucination-harness.md` or `.agents/rules/backend.md` | Add a concise numbered rule to the appropriate rule file. |
| **Visual / Interactive UI Regression** | `qc/tests/visual/` | Author a Playwright assertion (e.g. bounding box, pseudo-element style, or hover state). |
| **Backend Invariant / IDOR / Security** | `backend/tests/` | Add a test in `backend/tests/test_idor_guards.py` or `backend/tests/test_media_traversal.py`. |
| **Repo-Wide Integrity Check** | `scripts/audit-truth.sh` | Add an AST or schema validation step to the automated audit script. |
| **Skill Missed Activation** | Target `.agents/skills/*/SKILL.md` | Add the user's literal trigger phrase to the skill's `description`. |

---

## 4. Execution Protocol

When capturing a lesson:
1. **Be Empirical:** Only document what was actually observed and verified. Never guess or speculate.
2. **Minimal Diff:** Keep rule and violation entries concise, atomic, and actionable.
3. **Verify SSOT Integrity:** Always run `bash scripts/audit-truth.sh` after updating docs, rules, or skills to ensure zero reference drift.
4. **Summary Report:** Output a 3-line confirmation:
   - **What happened:** (Brief symptom)
   - **Root cause:** (Technical reason)
   - **Where it was saved:** (Target file and specific rule/test added)
