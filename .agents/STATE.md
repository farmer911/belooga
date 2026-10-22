# Active Working Memory (`STATE.md`)

## Objective & Hypothesis
- **Task (BEL-143 — Complete 30-Issue FE/BE/Router End-to-End Platform Remediation):**
  1. **Router & Navigation (`R1`–`R12`):** Fixed mobile drawer missing 5 Ecosystem tools + `NotificationBell`, `sm` vs `md` header breakpoint overlap, logout redirect on `/workspace/*`/`/admin/*`/`/cv-studio`, OAuth email/next pass-through, login return-URL (`?next=` & `belooga_return_to`), `/forgot-password` post-reset CTA, `/search` `?key=` & pagination sync, `/search` `VideoPitchModal`, `/ats-diagnostics?score=` badge, and `/expert-review?order_id=` highlight.
  2. **Frontend UI-Only -> Full-Stack Integration:** Wired `/cv-studio` `localStorage` auto-save, guest/cloud save, editable/reorderable Projects & Contact sections, ReportLab PDF export, and server ATS audit; `/ats-diagnostics` CV file/profile loader, clickable scan history, and `/v1/match/tailor-cv`; `/expert-review` PDF resume upload and live MoMo QR in booking modal; and `/workspace/jobs` direct Edit button on every `KanbanCard`.
  3. **Backend APIs:** Added `POST /v1/match/tailor-cv`, enriched `GET /v1/match/history` with `matched_skills`/`missing_skills`, added city multipliers & dynamic YoY growth in `GET /v1/catalogs/salary-benchmark`, wired `POST /v1/contact/` recruiter inquiry notification to candidate `NotificationBell`, and prioritized real `db_orders` in `GET /v1/analytics/dashboard`.

## Pre-Mortem Risks
- Enforce `be_files_over_300_lines = 0`, `fe_files_over_300_lines = 0`, `fe_max_page_lines <= 241`, `trust-benchmark.py = 100%`.

## Execution Checklist
- [x] **Step 1 (Track A — Backend APIs & Pytest):** Implemented `/v1/match/tailor-cv`, enriched `/v1/match/history`, location-aware `/v1/catalogs/salary-benchmark`, recruiter contact notifications, and DB-first analytics (`96/96` Pytest passed).
- [x] **Step 2 (Track B — Router, Header, Auth, Homepage & Search):** Fixed `R1`–`R10` and added `/search` facet filters + `VideoPitchModal`.
- [x] **Step 3 (Track C — Career Tools & Admin):** Upgraded `/cv-studio`, `/ats-diagnostics`, `/expert-review`, and `/workspace/jobs`.
- [x] **Step 4 (Verification & PR Gate):** Verified `audit-truth.sh` (`100%` trust benchmark) and `200/200` Playwright E2E tests across 5 browsers.
