---
name: be-service-cms
description: Public CMS endpoints, contact inquiries, FAQs, job postings, and profile abuse reporting in backend/app/api/v1/endpoints/cms.py. Use when modifying contact forms, platform FAQs, career listings, or candidate report flow. Not for frontend public CMS page UI (fe-page-cms-public).
---

# Public CMS & Moderation (Domain 8)

## Current Reality (AS-IS)
- Implemented directly in `backend/app/api/v1/endpoints/cms.py` using `AsyncSession`.
- No separate service layer.
- `contact_inquiries` and `profile_reports` tables store persisted inquiries and reports.
- FAQs and career postings are served via in-memory dictionaries in `cms.py`.

## Project-Specific Rules
- **Public Submissions:** `POST /v1/contact/` and `POST /v1/profile/{user_id}/report/` are public endpoints (no authentication required).
- **Graceful Error Handling:** Inquiries and reports return a standard JSON confirmation: `{"message": "..."}` or `{"success": true}`.

## Known Traps
- `career_postings` table exists in `initdb.sql`, but `GET /v1/career/jobs/` currently returns in-memory dictionaries. Do not expect database foreign keys on jobs.

## Canonical Example
- `backend/app/api/v1/endpoints/cms.py:submit_contact_inquiry`

## Self-Verification
- `curl -s http://localhost:8000/v1/faqs`
- `bash scripts/audit-truth.sh`
