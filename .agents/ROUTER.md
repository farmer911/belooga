# Agent Router & Execution Protocol

> **Purpose:** Routes tasks through the Adversarial Production Supervisor (`belooga-supervisor`), domain skills, automated truth synchronization, and the Anti-Deception Trust Benchmark.

---

## 1. Closed-Loop Execution Pipeline

```
[USER IDEA / TASK / BUG REPORT]
                │
                ▼
1. SUPERVISOR CHALLENGE & RESEARCH FIRST (`belooga-supervisor`):
   - Zero sycophancy: challenge weak ROI, bloat, or contradictions first.
   - Research order: `graphify` -> `CURRENT_STATE.md` -> `.agents/PRODUCT_THESIS.md` -> Domain `SKILL.md`.
   - If touching >= 3 files or API/DB contracts: write hypothesis, risks & checklist in `.agents/STATE.md` (<= 50 lines).
                │
                ▼
2. SCOPED IMPLEMENTATION (`tdd-workflow` + Default `ponytail`):
   - TDD Red-first. Preserve clean layering (`router -> service -> repository`, < 300 lines/file).
   - Compress 200-line code into 50 lines automatically without asking permission.
                │
                ▼
3. AUTOMATED KNOWLEDGE SYNC & VERIFICATION:
   - Sync SSOT & Skills: `python3 scripts/generate-current-state.py --allow-dirty && python3 scripts/render-skill-facts.py --write`
   - Anti-Deception Benchmark: `python3 scripts/trust-benchmark.py`
   - Master SSOT & Test Suite: `bash scripts/audit-truth.sh`
                │
                ▼
4. ADVERSARIAL CODE REVIEW & 5-STEP SELF-LEARN:
   - Frontend changes ➔ `fe-code-review` | Backend changes ➔ `be-code-review`
   - Any bug/regression/lesson ➔ `belooga-self-learn` (promote lesson into script guard + update `SKILL.md` / `.agents/PRODUCT_THESIS.md`).
                │
                ▼
5. DEFINITION OF DONE SIGN-OFF:
   - Lock improved metrics: `python3 scripts/ratchet.py --update` (if better)
   - Run `python3 scripts/lint-skills.py --quiet && python3 scripts/trust-benchmark.py`
   - Output concise empirical proof block with unedited benchmark & test logs.
```

---

## 2. Intent-Based Skill Routing Matrix

| Scope / Department | Target Path | Skill |
| :--- | :--- | :--- |
| **Forensic Investigate & Plan (`/investigate`)** | Read-only trace & `.agents/STATE.md` | `investigate` |
| **Production Supervisor & Pushback** | All tasks, ideas & plans | `belooga-supervisor` |
| **All Tasks (Integrity & Evidence)** | All files | `engineering-integrity-and-evidence` |
| **DoD Quality Contract** | All completions & PRs | `definition-of-done` |
| **TDD & Bug Fixes** | Backend / tests / QC | `tdd-workflow` |
| **5-Step Self-Learn & Evolution**| `docs/VIOLATIONS_REGISTER.md`, `.agents/` | `belooga-self-learn` |
| **Senior Agile / Kanban Delivery** | Feature branches, PRs, Kanban tickets | `belooga-senior-agile-workflow` |
| **Default Code Compression** | All code implementations | `ponytail` |
| **UI/UX Design Intelligence** | Design tokens, palettes, UX checklists | `ui-ux-pro-max` |
| **Backend System Standards** | `backend/app/` | `belooga-backend-engineering` |
| **Frontend UI Standards** | `frontend/src/` | `belooga-frontend-engineering` |
| **QC & Playwright Testing** | `qc/` | `belooga-qc-engineering` |
| **Backend Code Review** | Backend PRs / diffs | `be-code-review` |
| **Frontend Code Review** | Frontend PRs / diffs | `fe-code-review` |
| **Backend: Core (Auth, Profile, Timeline, Media)** | `auth.py`, `profile.py`, `timeline.py`, `media.py` | `be-domain-core` |
| **Backend: Discovery (Search, Catalogs, CMS)** | `search.py`, `catalogs.py`, `cms.py` | `be-domain-discovery` |
| **Backend: Monetization (Review, ATS, Jobs, Analytics, MoMo)** | `expert_review.py`, `ats_matching.py`, `job_tracker.py`, `analytics.py`, `payments.py` | `be-domain-monetization` |
| **Frontend: Workspace, Studio & Auth** | `app/user/[username]/*`, `app/(auth)/*` | `fe-domain-workspace` |
| **Frontend: Public, Search & CMS** | `app/page.tsx`, `app/search/`, `app/public/[username]/`, `app/(public)/*` | `fe-domain-public` |
| **Frontend: Career Tools, ATS, Jobs & Analytics** | `app/(public)/expert-review/`, `app/ats-diagnostics/`, `app/cv-studio/`, `app/salary-benchmark/`, `app/workspace/jobs/`, `app/admin/analytics/` | `fe-domain-career-tools` |
| **Code Review for Bloat** | PR review for over-engineering | `ponytail-review` |
| **Repository Bloat Audit** | Whole-repo over-engineering scan | `ponytail-audit` |
| **Technical Debt Ledger** | Track ponytail shortcuts | `ponytail-debt` |

---

## 3. Cross-Domain Impact Matrix

When modifying a backend bounded context, verify its downstream frontend dependents:
- **`be-domain-core`:** Verify `fe-domain-workspace` (WebRTC studio, timeline DnD, auth, settings) and `fe-domain-public` (`/public/[username]` video & PDF).
- **`be-domain-discovery`:** Verify `fe-domain-public` (`/search`, `/contact-us`, `/careers`) and `fe-domain-career-tools` (`/salary-benchmark`).
- **`be-domain-monetization`:** Verify `fe-domain-career-tools` (`/expert-review`, `/ats-diagnostics`, `/workspace/jobs`, `/admin/analytics`, MoMo QR checkout).

---

## 4. Merge Conditions
Merge only when:
1. `python3 scripts/trust-benchmark.py` achieves **100% Trust Score (0 violations)**.
2. CI passes all verification gates: `bash scripts/audit-truth.sh`.
3. `python3 scripts/lint-skills.py --quiet` reports 0 ERROR.
