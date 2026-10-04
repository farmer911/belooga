---
name: be-service-profile
description: Candidate profile CRUD, visibility (is_hidden), PII privacy, and skills endorsement in backend/app/api/v1/endpoints/profile.py. Use when modifying candidate bios, headlines, seeking status, or skills associations. Not for work/education timeline (be-service-timeline) or media uploads (be-service-media).
---

# Candidate Profile (Domain 2)

## Current Reality (AS-IS)
- Implemented directly in `backend/app/api/v1/endpoints/profile.py` using `AsyncSession`.
- Database tables: `candidate_profiles`, `profile_skills`, `profile_media`.
- Video pitch posters are stored in `profile_media` with category `pitch_poster` (not a column on `candidate_profiles`).

## Project-Specific Rules
- **Privacy & PII Protection:**
  - `GET /v1/profile/{username}` uses `Depends(get_current_user_optional)`.
  - For anonymous visitors or non-owners: if `is_hidden=TRUE`, return `404 Not Found`.
  - For public callers: `email` and `phone` MUST be set to `None` in the returned JSON.
  - Profile owners (`current_user.username == username`) or admins receive full PII (`email`, `phone`).
- **IDOR Protection on Mutations:**
  - `PATCH /v1/profile/{username}`, `POST /v1/profile/{username}/skills/`, `DELETE /v1/profile/{username}/skills/{skill_name}/` MUST enforce `current_user: AuthenticatedUser = Depends(get_current_user)` and `verify_profile_owner(username, current_user)`.

## Known Traps
- Never guess owner identity by splitting email strings. Always check `current_user.username.lower() == clean_username` or match `candidate_profiles.identity_id == current_user.id`.

## Canonical Example
- `backend/app/api/v1/endpoints/profile.py:get_candidate_public_profile`

## Self-Verification
- `backend/.venv/bin/pytest backend/tests/test_profile_privacy_and_pii.py -v`
- `backend/.venv/bin/pytest backend/tests/test_idor_guards.py -v`
- `bash scripts/audit-truth.sh`
