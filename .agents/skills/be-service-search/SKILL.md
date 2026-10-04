---
name: be-service-search
description: Candidate full-text search and autocomplete suggestions in backend/app/api/v1/endpoints/search.py. Use when modifying search rankings, TSVECTOR queries, ts_rank scoring, or autocomplete filtering. Not for profile updates (be-service-profile) or frontend search UI (fe-page-search).
---

# Talent Discovery & Search (Domain 6)

## Current Reality (AS-IS)
- Implemented directly in `backend/app/api/v1/endpoints/search.py` using `AsyncSession`.
- Full-text search executes against `candidate_profiles.search_vector` via `plainto_tsquery('english', :q)`.
- Autocomplete suggestions filter out hidden candidates (`is_hidden = FALSE`).
- GIN index on `candidate_profiles(search_vector)`.

## Project-Specific Rules
- **ADR-005 Conformance:**
  - Queries must use `search_vector @@ plainto_tsquery('english', :q)`.
  - NEVER combine `search_vector @@` with `OR p.headline ILIKE '%...%'` — this disables index scanning and fails SSOT Gate 6.
- **Hidden Candidate Protection:**
  - Always enforce `WHERE is_hidden = FALSE` in search queries to prevent leaking hidden candidate data to public recruiters.

## Known Traps
- Adding an unindexed `OR ILIKE` fallback destroys query performance across large datasets and is strictly rejected by the auditor.

## Canonical Example
- `backend/app/api/v1/endpoints/search.py:search_candidates`

## Self-Verification
- `backend/.venv/bin/pytest backend/tests/test_profile_privacy_and_pii.py -k search -v`
- `bash scripts/audit-truth.sh`
