---
name: be-service-search
description: Authoritative Backend Department Skill for Talent Discovery & Search (Domain 6). Covers PostgreSQL TSVECTOR generated columns, GIN indexing, ts_rank ranking, and pg_trgm fuzzy matching.
---

# 🔎 Backend Department Skill: Talent Discovery & Search Engine (Domain 6)

> **Department:** Backend Systems Engineering — Search & Information Retrieval Division  
> **Target Files:** `backend/app/api/v1/endpoints/search.py`, `backend/app/services/search_service.py`, `backend/app/repositories/search_repo.py`  
> **Database Extensions:** `pg_trgm`, `btree_gin`  

---

## 1. Department Role & Mission

This department powers the talent discovery engine: indexing candidate profiles, performing ranked full-text search queries using weighted `tsvector` columns, and executing fuzzy trigram autocomplete recommendations.

---

## 2. Cross-Departmental Impact Matrix (Dependencies)

| Dependency Direction | Department | Interface & Contract |
| :--- | :--- | :--- |
| **Upstream (Depends on)** | `be-service-profile` | Queries `candidate_profiles` where `is_hidden = FALSE` |
| **Downstream (Outputs to)** | `fe-page-search` | Serves `GET /v1/profile/search/` with pagination and rank scores |
| **Downstream (Outputs to)** | `fe-page-home` | Powers home quick search launcher |

---

## 3. Weighted TSVECTOR Full-Text Search Specification

The database automatically compiles a weighted search vector on `candidate_profiles`:
* **Weight 'A' (Highest Priority):** `first_name`, `last_name`
* **Weight 'B':** `headline`
* **Weight 'C':** `bio`
* **Weight 'D':** `location`

```sql
SELECT p.id, p.username, p.first_name, p.last_name, p.headline, p.location,
       ts_rank(p.search_vector, plainto_tsquery('english', :q)) AS rank
FROM candidate_profiles p
WHERE p.is_hidden = FALSE
  AND (p.search_vector @@ plainto_tsquery('english', :q) OR p.headline ILIKE :wildcard)
ORDER BY rank DESC, p.created_at DESC
LIMIT :limit OFFSET :offset;
```
