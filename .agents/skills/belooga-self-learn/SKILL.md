---
name: belooga-self-learn
description: Repository memory, 5-step root-cause learning, Rule-to-Script promotion, and continuous evolution protocol. Use when learning from an error, test failure, user correction, or incident, updating docs/VIOLATIONS_REGISTER.md, or promoting lessons into scripts/trust-benchmark.py and domain skills. Not for general profile or code features.
---

# Belooga 5-Step Continuous Learning & Self-Evolution Protocol

> **Purpose:** Transform runtime incidents, user corrections, and debugging discoveries into permanent deterministic code guards and compressed domain intelligence.

---

## 1. Trigger Conditions

Activate this protocol immediately when:
1. **User Correction / Pushback:** The user exposes a hallucination, sycophancy, band-aid fix, or unverified assumption.
2. **Test / Gate Regression:** A pytest, Playwright E2E, typecheck, or `scripts/trust-benchmark.py` gate fails during development.
3. **Non-Obvious Root Cause:** A fix uncovers a deeper architectural trap (e.g. async event-loop blocking in services, CSS cascade collision, IDOR gap, or ORM lazy-load trap).
4. **Post-Feature Evolution:** A new feature introduces new routes, models, or product laws that must be synchronized into the harness.

---

## 2. The Mandatory 5-Step Learning Structure

Every mistake or operational discovery must be analyzed and resolved across all 5 dimensions:

| Step | Question Answered | Concrete Action Required |
|---|---|---|
| **1. Where (Sai ở đâu)** | Exact file, line range, and architectural layer (`router` / `service` / `repo` / `hook` / `CSS`). | Pinpoint the exact symbol and call site, never vague descriptions. |
| **2. How & Why (Sai như thế nào)** | What was the exact technical mechanism and flawed assumption behind the bug? | Trace the root cause across all callers (`grep` / `graphify`), not just the surface symptom. |
| **3. Minimal Fix (Sửa làm sao)** | How is the root cause fixed with the fewest lines (Ponytail)? | Fix the shared function once; delete band-aid wrappers or redundant branches. |
| **4. Anti-Recurrence Guard (Chặn tái phạm)** | How do we make it physically impossible to repeat this mistake? | **Rule-to-Script Promotion:** Add an AST/Regex check in `scripts/trust-benchmark.py`, `scripts/audit-truth.sh`, or a regression test in `backend/tests/` / `qc/tests/`. |
| **5. Self-Upgrade (Tự tiến hóa)** | How does the agent upgrade its own brain for the next task? | Update `## Known Traps` in the target `SKILL.md`, log severe traps in `docs/VIOLATIONS_REGISTER.md`, and update `.agents/PRODUCT_THESIS.md` (respecting the 120-line eviction cap). |

---

## 3. Destination Routing & Rule-to-Script Promotion

> **Iron Law:** Prose rules in Markdown can be forgotten by LLMs; exit code `1` in Python/Bash cannot. Always prefer promoting a lesson into an executable check.

| Discovery Type | Target Destination | Mandatory Action |
|---|---|---|
| **Band-Aid / Deception / Anti-Pattern** | `scripts/trust-benchmark.py` or `scripts/audit-truth.sh` | Encode an AST or regex detector so future commits fail automatically. |
| **Code Bloat / Type Evasion Improvement** | `.agents/ratchet.json` | Run `python3 scripts/ratchet.py --update` to lock in the lower baseline. |
| **New Route / Table / Schema Added** | `.agents/skills/*/SKILL.md` & `CURRENT_STATE.md` | Run `python3 scripts/generate-current-state.py --allow-dirty && python3 scripts/render-skill-facts.py --write`. |
| **Domain-Specific Trap** | `.agents/skills/{be-service-*,fe-page-*}/SKILL.md` | Add a 1-2 line bullet under `## Known Traps` (keep skill <= 200 lines). |
| **Business / UX / Human Insight** | `.agents/PRODUCT_THESIS.md` | Add insight and evict/compress old lines to stay <= 120 lines. |
| **Severe Hallucination / UI Distortion** | `docs/VIOLATIONS_REGISTER.md` | Append `[VIOLATION-XXX]` with the 5-step breakdown. |

---

## 4. Verification & Sign-Off

After executing a self-learn update, always run:
```bash
python3 scripts/render-skill-facts.py --write
python3 scripts/lint-skills.py --quiet
python3 scripts/trust-benchmark.py
```
Output a 5-line summary mapping strictly to: **Where -> How/Why -> Fix -> Automated Guard -> Brain Upgrade**.
