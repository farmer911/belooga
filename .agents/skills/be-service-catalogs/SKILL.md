---
name: be-service-catalogs
description: Authoritative Backend Department Skill for Master Catalogs & Taxonomies (Domain 7). Covers standardized skill dictionaries, company branding logos, accredited universities, and geographic locations.
---

# 📚 Backend Department Skill: Master Catalogs & Taxonomies (Domain 7)

> [!WARNING] TARGET ARCHITECTURE (NOT YET IMPLEMENTED) – CURRENTLY INLINED IN ROUTER ENDPOINTS
> **Current Reality:** Inlined directly in router endpoints at `backend/app/api/v1/endpoints/catalogs.py`. Note: `skills` is queried from the database table; `company`, `school`, and `location` autocompletes are currently served via in-memory dictionaries.
> **Target Modular Service:** backend/app/services/catalog_service.py (planned target)
> **Department:** Backend Systems Engineering — Taxonomies & Master Data Division  
> **Database Tables:** `skills`, `profile_skills`, `catalog_companies`, `catalog_schools`, `catalog_locations`  

---

## 1. Department Role & Mission

This department establishes standardized vocabularies across the Belooga platform: master technical skills, verified company names and logos, accredited universities, and geographical locations.

---

## 2. Cross-Departmental Impact Matrix (Dependencies)

| Dependency Direction | Department | Interface & Contract |
| :--- | :--- | :--- |
| **Downstream (Outputs to)** | `fe-section-workspace-skills` | Serves `GET /v1/profile/skills/` for candidate skill tags |
| **Downstream (Outputs to)** | `fe-section-workspace-timeline` | Serves `GET /v1/profile/company/` and `GET /v1/profile/school/` |
| **Downstream (Outputs to)** | `fe-page-search` | Supplies autocomplete taxonomy for discovery filters |

---

## 3. Resilient Catalog Fallback Standard

To guarantee zero frontend disruption even during database seed or cold-start scenarios, the Catalog Service implements a resilient tiered lookup:
1. Primary query: Scan PostgreSQL `skills` table.
2. Resilient fallback: If catalog table returns empty, serve curated master seed array (React, Python, TypeScript, etc.) without throwing an HTTP 500 error.
