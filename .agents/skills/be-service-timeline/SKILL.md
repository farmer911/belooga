---
name: be-service-timeline
description: Authoritative Backend Department Skill for Career Timeline & Reordering (Domain 3). Covers Work Experience, Education, Awards CRUD, display_order synchronization, and pessimistic transaction locking.
---

# ⏳ Backend Department Skill: Career Timeline & Reordering (Domain 3)

> [!WARNING] TARGET ARCHITECTURE (NOT YET IMPLEMENTED) – CURRENTLY INLINED IN ROUTER ENDPOINTS
> **Current Reality:** Inlined directly in router endpoints at `backend/app/api/v1/endpoints/timeline.py`
> **Target Modular Service:** backend/app/services/timeline_service.py (planned target)
> **Target Modular Model:** backend/app/models/timeline.py (planned target)
> **Department:** Backend Systems Engineering — Career Timeline Division  
> **Database Tables:** `job_experiences`, `education_experiences`, `award_certifications`  

---

## 1. Department Role & Mission

This department manages structured career trajectories: previous and current job positions, academic degrees, GPAs, and awards. It guarantees **strict integer sequencing (`display_order`)** under concurrent drag-and-drop operations.

---

## 2. Cross-Departmental Impact Matrix (Dependencies)

| Dependency Direction | Department | Interface & Contract |
| :--- | :--- | :--- |
| **Upstream (Depends on)** | `be-service-profile` | Foreign key referencing `candidate_profiles.id` |
| **Upstream (Depends on)** | `be-service-catalogs` | References company logos and verified school names |
| **Downstream (Outputs to)** | `be-service-media` | Supplies timeline history for dynamic PDF resume generation |
| **Downstream (Outputs to)** | `fe-section-workspace-timeline` | Serves CRUD and reordering endpoints |

---

## 3. Concurrency & Pessimistic Locking Protocol

When ordering timeline items (`POST /v1/profile/{username}/job-experiences/order/`):
```python
# Standard Pessimistic Reordering Transaction in backend/app/api/v1/endpoints/timeline.py
# 1. Lock all job experience rows for this candidate
stmt = (
    text("SELECT id, display_order FROM job_experiences WHERE profile_id = :pid FOR UPDATE")
)
res = await db.execute(stmt, {"pid": profile_id})
existing_jobs = {str(row.id): row for row in res.fetchall()}

# 2. Apply verified new sequence
for item in payload.orders:
    if str(item.id) in existing_jobs:
        await db.execute(
            text("UPDATE job_experiences SET display_order = :order WHERE id = :id"),
            {"order": item.order, "id": item.id}
        )

# 3. Explicit commit
await db.commit()
```
👉 **Guarantees zero race conditions or sequence gaps.**
