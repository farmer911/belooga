---
name: be-service-catalogs
description: Master taxonomies for skills, company names, schools, and locations in backend/app/api/v1/endpoints/catalogs.py. Use when modifying catalog lookup endpoints or dictionary fallback lists. Not for candidate profile associations (be-service-profile) or frontend catalog tags (fe-section-workspace-skills).
---

# Master Catalogs & Taxonomies (Domain 7)

## Current Reality (AS-IS)
- Implemented directly in `backend/app/api/v1/endpoints/catalogs.py`.
- No separate service layer.
- `skills` is queried from the PostgreSQL `skills` table with in-memory fallback.
- `company`, `school`, and `location` autocompletes are currently served via in-memory dictionaries in `catalogs.py`.

## Project-Specific Rules
- **Resilient Fallback:** If the `skills` database table is empty, return a curated default list without raising an HTTP 500 error.
- **Case-Insensitive Prefix Matching:** Suggestions must filter using lowercase case-insensitive prefix/contains checks.

## Known Traps
- `catalog_companies`, `catalog_schools`, and `catalog_locations` database tables exist in `initdb.sql`, but active endpoint code currently serves in-memory dictionary lists. Do not assume foreign key lookups against these catalog tables in router endpoints.

## Canonical Example
- `backend/app/api/v1/endpoints/catalogs.py:list_skills`

## Self-Verification
- `curl -s http://localhost:8000/v1/profile/skills/`
- `bash scripts/audit-truth.sh`
