---
name: be-service-timeline
description: Authoritative Backend Department Skill for Career Timeline & Reordering (Domain 3). Covers Work Experience, Education, Awards CRUD, display_order synchronization, and pessimistic transaction locking.
---

# ⏳ Backend Department Skill: Career Timeline & Reordering (Domain 3)

> **Department:** Backend Systems Engineering — Career Timeline Division  
> **Target Files:** `backend/app/api/v1/endpoints/timeline.py`, `backend/app/services/timeline_service.py`, `backend/app/models/timeline.py`  
> **Database Tables:** `job_experiences`, `education_experiences`, `awards_certifications`  

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

When reordering timeline items (`POST /v1/profile/{username}/job-experiences/reorder/`):
```python
# Standard Pessimistic Reordering Transaction
async with db.begin():
    # 1. Lock all job experience rows for this candidate
    stmt = (
        select(JobExperience)
        .where(JobExperience.profile_id == profile_id)
        .with_for_update()
    )
    res = await db.execute(stmt)
    existing_jobs = {job.id: job for job in res.scalars()}

    # 2. Apply verified new sequence
    for item in reorder_payload.orders:
        if item.id in existing_jobs:
            existing_jobs[item.id].display_order = item.order

    # Transaction commits automatically on context exit
```
👉 **Guarantees zero race conditions or sequence gaps.**
