---
name: be-service-timeline
description: Work-history, education, and awards CRUD + drag-and-drop reordering in backend/app/api/v1/endpoints/timeline.py. Use when adding or updating job-experiences, education, display_order, or reorder locking. Not for general profile fields (be-service-profile) or frontend drag UI (fe-page-workspace).
---

# Career Timeline & Reordering (Domain 3)

## Current Reality (AS-IS)
- No separate service/repository layer. Endpoints use `AsyncSession` directly in `backend/app/api/v1/endpoints/timeline.py`.
- Endpoints: see `CURRENT_STATE.md §2`.
- Database tables: `job_experiences`, `education_experiences`, `award_certifications`.

## Project-Specific Rules
- **Pessimistic Locking on Reorder:** When updating `display_order`, query existing rows with `SELECT id, display_order FROM job_experiences WHERE profile_id = :pid FOR UPDATE`. Apply order updates and perform explicit `await db.commit()` in a single transaction.
- **Ownership Guard:** Verify ownership using `verify_profile_owner(clean_username, current_user)`. Never trust email substrings.

## Known Traps
- **Autobegun Sessions:** Calling nested `db.begin()` on a session that has already begun causes an error. Execute statements directly on `db` and conclude with `await db.commit()`.

## Canonical Example
- `backend/app/api/v1/endpoints/timeline.py:reorder_job_experiences`

## Self-Verification
- `backend/.venv/bin/pytest backend/tests/test_timeline_reorder.py -v`
- `bash scripts/audit-truth.sh`
