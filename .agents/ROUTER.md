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
| **Backend: Auth & Session** | `api/v1/endpoints/auth.py` | `be-service-auth` |
| **Backend: Candidate Profile**| `api/v1/endpoints/profile.py` | `be-service-profile` |
| **Backend: Career Timeline** | `api/v1/endpoints/timeline.py` | `be-service-timeline` |
| **Backend: Media & Video** | `api/v1/endpoints/media.py` | `be-service-media` |
| **Backend: Candidate Search** | `api/v1/endpoints/search.py` | `be-service-search` |
| **Backend: Catalogs** | `api/v1/endpoints/catalogs.py` | `be-service-catalogs` |
| **Backend: CMS & Reports** | `api/v1/endpoints/cms.py` | `be-service-cms` |
| **Backend: Expert CV Review** | `api/v1/endpoints/expert_review.py` | `be-service-expert-review` |
| **Backend: ATS Diagnostics** | `api/v1/endpoints/ats_matching.py` | `be-service-ats` |
| **Backend: Job Tracker Kanban**| `api/v1/endpoints/job_tracker.py` | `be-service-jobs` |
| **Backend: Executive Analytics**| `api/v1/endpoints/analytics.py` | `be-service-analytics` |
| **Backend: MoMo Payments** | `api/v1/endpoints/payments.py` | `be-service-payments` |
| **Frontend: Homepage** | `app/page.tsx` | `fe-page-home` |
| **Frontend: Talent Search** | `app/search/` | `fe-page-search` |
| **Frontend: Public Profile** | `app/public/[username]/` | `fe-page-public-profile` |
| **Frontend: Workspace Hub** | `app/user/[username]/` | `fe-page-workspace` |
| **Frontend: Auth & Onboarding**| `app/(auth)/` | `fe-page-auth` |
| **Frontend: User Settings** | `app/user/[username]/settings/`, `update/` | `fe-page-user-management` |
| **Frontend: Public CMS** | `app/(public)/blog/`, `careers/`, `contact-us/`, `help/` | `fe-page-cms-public` |
| **Frontend: Expert CV Review** | `app/(public)/expert-review/` | `fe-page-expert-review` |
| **Frontend: ATS Diagnostics** | `app/ats-diagnostics/` | `fe-page-ats` |
| **Frontend: CV Studio & Salary**| `app/cv-studio/`, `app/salary-benchmark/` | `fe-page-cv-studio` |
| **Frontend: Job Tracker Kanban**| `app/workspace/jobs/` | `fe-page-jobs` |
| **Frontend: Executive Analytics**| `app/admin/analytics/` | `fe-page-analytics` |
| **Code Review for Bloat** | PR review for over-engineering | `ponytail-review` |
| **Repository Bloat Audit** | Whole-repo over-engineering scan | `ponytail-audit` |
| **Technical Debt Ledger** | Track ponytail shortcuts | `ponytail-debt` |

---

## 3. Cross-Domain Impact Matrix

When modifying a service or page, verify its downstream dependents:
- **`be-service-media`:** Verify `fe-page-workspace` (WebRTC studio recording & chunk upload) and `fe-page-public-profile` (video playback).
- **`be-service-timeline`:** Verify `fe-page-workspace` (drag-and-drop timeline) and `be-service-media` (ReportLab PDF generation).
- **`be-service-profile`:** Verify `fe-page-search` (search vector synchronization) and `fe-page-workspace` (bio sync).
- **`be-service-expert-review`:** Verify `fe-page-expert-review` (packages, booking modal, order lists).
- **`be-service-ats` & `be-service-payments`:** Verify `fe-page-ats` (ATS scorecard & MoMo QR checkout modal).
- **`be-service-catalogs`:** Verify `fe-page-cv-studio` (`/salary-benchmark` percentiles) and `fe-page-workspace` (skills autocomplete).
- **`be-service-jobs`:** Verify `fe-page-jobs` (`/workspace/jobs` Kanban board).
- **`be-service-analytics`:** Verify `fe-page-analytics` (`/admin/analytics` KPI & revenue dashboard).

---

## 4. Merge Conditions
Merge only when:
1. `python3 scripts/trust-benchmark.py` achieves **100% Trust Score (0 violations)**.
2. CI passes all verification gates: `bash scripts/audit-truth.sh`.
3. `python3 scripts/lint-skills.py --quiet` reports 0 ERROR.
