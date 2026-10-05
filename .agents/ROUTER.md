# Agent Router & Execution Protocol

> **Purpose:** Routes tasks to the correct specialized skills, enforces adversarial review, and executes the Definition of Done.

---

## 1. Execution Pipeline

```
[USER TASK / FEATURE / BUG REPORT]
                │
                ▼
1. SCOPED SKILL INGESTION: Consult Routing Matrix to load the specific domain skill.
   Always load: `engineering-integrity-and-evidence` + `tdd-workflow`.
                │
                ▼
2. SCOPED IMPLEMENTATION: TDD Red-first. Follow clean architecture layering (< 300 lines/file).
                │
                ▼
3. AUTOMATED VERIFICATION:
   - Backend: `backend/.venv/bin/pytest backend/tests/ -v`
   - Frontend: `cd frontend && bun x tsc --noEmit`
   - Master SSOT: `bash scripts/audit-truth.sh`
                │
                ▼
4. ADVERSARIAL CODE REVIEW:
   - Frontend changes ➔ review via `fe-code-review`
   - Backend changes  ➔ review via `be-code-review`
   Reviewers evaluate blocking invariants and verify ratchet metrics (`python3 scripts/ratchet.py`).
                │
                ▼
5. DEFINITION OF DONE SIGN-OFF:
   - Enforce criteria in `definition-of-done` skill.
   - Run `python3 scripts/lint-skills.py --quiet`
   - Output empirical proof block with unedited command logs and exit codes.
```

---

## 2. Intent-Based Skill Routing Matrix

| Scope / Department | Target Path | Skill |
| :--- | :--- | :--- |
| **All Tasks (Integrity & Evidence)** | All files | `engineering-integrity-and-evidence` |
| **DoD Quality Contract** | All completions & PRs | `definition-of-done` |
| **TDD & Bug Fixes** | Backend / tests / QC | `tdd-workflow` |
| **Retrospectives & Postmortems**| `docs/VIOLATIONS_REGISTER.md` | `belooga-self-learn` |
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
| **Frontend: Homepage** | `app/page.tsx` | `fe-page-home` |
| **Frontend: Talent Search** | `app/search/` | `fe-page-search` |
| **Frontend: Public Profile** | `app/public/[username]/` | `fe-page-public-profile` |
| **Frontend: Workspace Hub** | `app/user/[username]/` | `fe-page-workspace` |
| **Frontend: Auth & Onboarding**| `app/(auth)/` | `fe-page-auth` |
| **Frontend: User Settings** | `app/user/[username]/settings/`, `update/` | `fe-page-user-management` |
| **Frontend: Public CMS** | `app/(public)/blog/`, `careers/`, `contact-us/`, `help/` | `fe-page-cms-public` |
| **Frontend: Expert CV Review** | `app/(public)/expert-review/` | `fe-page-expert-review` |
| **Minimal / Lazy Refactoring** | When user invokes ponytail | `ponytail` |
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

---

## 4. Merge Conditions
Merge only when:
1. CI passes all verification gates: `bash scripts/audit-truth.sh`.
2. Adversarial review APPROVE emitted with `python3 scripts/ratchet.py` showing no worse metrics.
3. `python3 scripts/lint-skills.py --quiet` reports 0 ERROR.
