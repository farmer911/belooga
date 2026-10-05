---
name: belooga-self-learn
description: Repository memory and continuous learning protocol for capturing operational discoveries, postmortems, and preventing regressions. Use when learning from an error or incident, updating docs/VIOLATIONS_REGISTER.md, or adding guardrails to prevent repeating mistakes. Not for general profile or code features.
---

# Belooga Continuous Learning Protocol

> **Purpose:** Transform runtime incidents, hallucination traps, and debugging insights into permanent, automated guardrails across the repository.

---

## 1. Trigger Conditions

Activate this protocol immediately when:
1. **User Correction:** The user points out a hallucination, an unverified assumption, or incorrect styling.
2. **Test Regression / CI Failure:** An E2E, visual, or pytest test catches a silent break or cascade error.
3. **Unexpected Root Cause:** A bug fix uncovers non-obvious architecture constraints (e.g. async event-loop blocking, CSS cascade collision, Safari WebRTC codec differences).

---

## 2. Standard Postmortem Structure

Every lesson must document three concrete elements:

| Component | Definition | Example |
|---|---|---|
| **1. Symptom** | The exact observed failure with error logs or dimensions. | Play button rendered as a 54px × 240px black ellipse on card hover. |
| **2. Root Cause** | The deep technical reason. | Class `.modal-trigger` had global layout styles in CSS, colliding with `.video-play-icon`. |
| **3. Harness Guard** | Concrete, automated barrier preventing recurrence. | Added TC-VIS-003 to `qc/tests/visual/play-button.spec.ts` and locked in harness rules. |

---

## 3. Destination Routing Matrix

Categorize the lesson and route it to the exact single source of truth:

| Lesson Category | Target File | Action Required |
|---|---|---|
| **Severe Hallucination / UI Distortion / Repeated Mistake** | `docs/VIOLATIONS_REGISTER.md` | Append a new entry `[VIOLATION-XXX]` with Symptom, Root Cause, Remediation, and Status. |
| **Global Agent Boundary / Prohibition** | `.agents/rules/anti-hallucination-harness.md` or `.agents/rules/backend.md` | Add a concise numbered rule to the appropriate rule file. |
| **Visual / Interactive UI Regression** | `qc/tests/visual/` | Author a Playwright assertion (e.g. bounding box, pseudo-element style, or hover state). |
| **Backend Invariant / IDOR / Security** | `backend/tests/` | Add a test in `backend/tests/test_idor_guards.py` or `backend/tests/test_media_traversal.py`. |
| **Skill Fact Outdated / Wrong** | `scripts/render-skill-facts.py` or `scripts/lint-skills.py` | Fix the generator or linter script. Never manually edit generated AUTO blocks. |
| **Skill Missed Activation** | Target `.agents/skills/*/SKILL.md` | Add the user's literal trigger phrase to the skill's `description`. |

---

## 4. Execution Protocol

When capturing a lesson:
1. **Be Empirical:** Only document what was actually observed and verified. Never guess or speculate.
2. **Minimal Diff:** Keep rule and violation entries concise, atomic, and actionable.
3. **Verify SSOT Integrity:** Always run `bash scripts/audit-truth.sh` and `python3 scripts/lint-skills.py --quiet` after updating docs, rules, or skills to ensure zero reference drift.
4. **Summary Report:** Output a 3-line confirmation:
   - **What happened:** (Brief symptom)
   - **Root cause:** (Technical reason)
   - **Where it was saved:** (Target file and specific rule/test added)
