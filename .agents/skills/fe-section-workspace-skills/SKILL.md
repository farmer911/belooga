---
name: fe-section-workspace-skills
description: Specialized Section Skill for Candidate Skills and Endorsements. Covers badge rendering, master catalog autocomplete, and skill add/delete operations.
---

# 🏷️ Section Skill: Candidate Skills & Catalog Management

> **Component Path:** `frontend/src/components/organisms/workspace/skills-section.tsx`  
> **Master Skill:** `fe-page-workspace`  
> **Backend Domain:** Domain 2 (Candidate Profile) & Domain 7 (Master Catalogs)  

---

## 1. Scope Boundary

This section maintains responsibility for:
1. Candidate technical and domain skill badge visualization.
2. Skill addition modal dialog trigger.
3. Master Skills Catalog debounced autocomplete integration (`/v1/profile/skills/`).
4. Instant skill removal from candidate credentials.

---

## 2. API Contracts & Autocomplete Flow

### 2.1. Master Catalog Autocomplete
* **Endpoint:** `GET /v1/profile/skills/`
* **Response:** Array of standardized skill names:
  ```json
  ["React", "TypeScript", "Python", "FastAPI", "PostgreSQL", "Docker", "Next.js"]
  ```

### 2.2. Add Candidate Skill
* **Endpoint:** `POST /v1/profile/{username}/skills/`
* **Payload:** `{ "name": "Kubernetes" }`
* **Response:** `{ "status": "success", "skill": "Kubernetes" }`

### 2.3. Delete Candidate Skill
* **Endpoint:** `DELETE /v1/profile/{username}/skills/{skill_name}`
* **Response:** `204 No Content` or `{ "status": "deleted" }`
* Cache Sync: Dispatch `queryClient.invalidateQueries({ queryKey: ["candidate-profile", username] })`.

---

## 3. QC Anti-Regression Selectors (Mandatory Preservation)

Playwright E2E tests target these exact skills selectors:
* `[data-testid="skills-container"]`: Main wrapper enclosing skill badges.
* `[data-testid="skill-badge"]`: Individual rendered badge pill.
* `[data-testid="add-skill-btn"]`: Modal opener for adding skills.
* `[data-testid="skill-autocomplete-input"]`: Text input for searching master catalog.
* `[data-testid="skill-suggestion-item"]`: Dropdown recommendation item.
* `[data-testid="remove-skill-btn"]`: Dismiss icon (x) removing the badge.
