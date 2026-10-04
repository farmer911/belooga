---
name: fe-page-cms-public
description: Authoritative Department Skill for Public Content & CMS Pages (Blog, Careers, Contact Us, Help FAQs, Legal Compliance). Covers dynamic article rendering, job applicant modals, contact inquiries, and FAQ accordions.
---

# 📰 Department Skill: Public Content, CMS & Compliance

> **Department:** Frontend Product Engineering — Public Content & Legal Division  
> **Routes:** `frontend/src/app/(public)/blog/`, `careers/`, `contact-us/`, `help/`, `privacy-policy/`, `terms-and-conditions/`  
> **Type:** Public Content, Support, and Regulatory Compliance  

---

## 1. Department Role & Mission

This department delivers the informational, regulatory, and community touchpoints of Belooga:
1. **Blog (`/blog`, `/blog/[slug]`):** Editorial articles, industry insights, and career growth advice.
2. **Careers (`/careers`):** Open positions at Belooga, company culture, and direct job applicant modal.
3. **Contact Us (`/contact-us`):** Support inquiries, sales contact form, and enterprise partnerships.
4. **Help Center (`/help`):** Searchable category-based FAQ accordions for candidates and recruiters.
5. **Legal (`/privacy-policy`, `/terms-and-conditions`):** Regulatory GDPR/CCPA disclosures and platform terms.

---

## 2. Cross-Departmental Impact Matrix (Dependencies)

| Dependency Direction | Department | Interface & Contract |
| :--- | :--- | :--- |
| **Upstream (Depends on)** | `be-service-cms` | `POST /v1/contact/`, `GET /v1/faqs`, `GET /v1/career/jobs/` (careers application modal is currently client-side stub) |
| **Downstream (Outputs to)** | `fe-page-home` | Footer and navigation links route to all public CMS pages |

---

## 3. QC Selectors & Automated Test Assertions

Playwright test suite `qc/tests/e2e/public-routes.spec.ts` verifies:
* `[data-testid="contact-form"]`: Main inquiry form on `/contact-us`.
* `[data-testid="contact-submit-btn"]`: Inquiry submit button.
* `[data-testid="careers-openings-list"]`: List of current job vacancies on `/careers`.
* `[data-testid="careers-apply-modal"]`: Applicant submission dialog.
* `[data-testid="help-faq-accordion"]`: Interactive FAQ accordion on `/help`.
* `[data-testid="legal-content-container"]`: Regulatory disclosure text on legal routes.
