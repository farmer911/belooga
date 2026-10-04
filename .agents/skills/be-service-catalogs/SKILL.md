---
name: be-service-catalogs
description: Authoritative Backend Department Skill for Master Catalogs & Taxonomies (Domain 7). Covers standardized skill dictionaries, company branding logos, accredited universities, and geographic locations.
---

# 📚 Backend Department Skill: Master Catalogs & Taxonomies (Domain 7)

> **Department:** Backend Systems Engineering — Taxonomies & Master Data Division  
> **Target Files:** `backend/app/api/v1/endpoints/catalogs.py`, `backend/app/services/catalog_service.py`  
> **Database Tables:** `skills_catalog`, `candidate_skills`, `companies_catalog`, `schools_catalog`  

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
1. Primary query: Scan PostgreSQL `skills_catalog` table with trigram index.
2. Resilient fallback: If catalog table returns empty, serve curated master seed array (React, Python, TypeScript, etc.) without throwing an HTTP 500 error.
