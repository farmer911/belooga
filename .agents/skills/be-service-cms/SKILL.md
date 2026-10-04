---
name: be-service-cms
description: Authoritative Backend Department Skill for Public CMS & Moderation (Domain 8). Covers contact inquiry tickets, platform FAQs, candidate moderation reporting, and legal compliance.
---

# 📢 Backend Department Skill: Public CMS & Moderation (Domain 8)

> [!WARNING] TARGET ARCHITECTURE (NOT YET IMPLEMENTED) – CURRENTLY INLINED IN ROUTER ENDPOINTS
> **Current Reality:** Inlined directly in router endpoints at `backend/app/api/v1/endpoints/cms.py`. Contact inquiries persist to `contact_inquiries`, moderation reports persist to `profile_reports`. FAQs and career listings are currently served via in-memory dictionaries.
> **Target Modular Service:** backend/app/services/cms_service.py (planned target)
> **Department:** Backend Systems Engineering — CMS & Trust Division  
> **Database Tables:** `contact_inquiries`, `profile_reports`  

---

## 1. Department Role & Mission

This department powers the communications, customer support, and safety infrastructure: recording visitor contact inquiries, serving platform FAQs, and processing candidate abuse/moderation reports.

---

## 2. Cross-Departmental Impact Matrix (Dependencies)

| Dependency Direction | Department | Interface & Contract |
| :--- | :--- | :--- |
| **Downstream (Outputs to)** | `fe-page-cms-public` | Serves `POST /v1/contact/`, `GET /v1/faqs`, `GET /v1/career/jobs/` |
| **Downstream (Outputs to)** | `fe-page-public-profile` | Serves `POST /v1/profile/{user_id}/report/` for recruiter abuse reporting |

---

## 3. Moderation Ticket Protocol

When a recruiter or user reports a profile:
1. `POST /v1/profile/{user_id}/report/` captures target candidate ID, reporter email, and report reason.
2. Ingests record into `profile_reports` table in PostgreSQL.
3. Automatically confirms submission to caller with `{ "message": "Report submitted successfully" }`.
