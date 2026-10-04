---
name: be-service-cms
description: Authoritative Backend Department Skill for Public CMS & Moderation (Domain 8). Covers contact inquiry tickets, platform FAQs, candidate moderation reporting, and legal compliance.
---

# 📢 Backend Department Skill: Public CMS & Moderation (Domain 8)

> **Department:** Backend Systems Engineering — CMS & Trust Division  
> **Target Files:** `backend/app/api/v1/endpoints/cms.py`, `backend/app/services/cms_service.py`  
> **Database Tables:** `contact_inquiries`, `cms_posts`, `cms_categories`, `moderation_logs`  

---

## 1. Department Role & Mission

This department powers the communications, customer support, and safety infrastructure: recording visitor contact inquiries, serving platform FAQs, and processing candidate abuse/moderation reports.

---

## 2. Cross-Departmental Impact Matrix (Dependencies)

| Dependency Direction | Department | Interface & Contract |
| :--- | :--- | :--- |
| **Downstream (Outputs to)** | `fe-page-cms-public` | Serves `POST /v1/contact/`, `GET /v1/faqs` |
| **Downstream (Outputs to)** | `fe-page-public-profile` | Serves `POST /v1/report/` for recruiter abuse reporting |

---

## 3. Moderation Ticket Protocol

When a recruiter or user reports a profile:
1. `POST /v1/report/` captures target candidate ID, reporter IP/account, and report reason.
2. Ingests record into `moderation_logs` with status `pending_review`.
3. If a profile exceeds 3 flagged violations, automated notification triggers for administrative review.
