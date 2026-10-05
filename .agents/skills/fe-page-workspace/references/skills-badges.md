# Section Reference: Skills & Profile Badges

- **Components:** `frontend/src/components/features/profile/skills-card.tsx`, `frontend/src/components/features/profile/languages-interests-card.tsx`
- **Hook:** `frontend/src/hooks/use-candidate-profile.ts`
- **Master Skill:** `fe-page-workspace`
- **Backend Domain:** Domain 2 (Candidate Profile) & Domain 6 (Master Catalogs)

---

## 1. Scope Boundary
This section maintains responsibility for:
1. Displaying candidate skill badges, proficiency levels, and verified badges.
2. Inline skill addition and deletion modal / chip list.
3. Rendering secondary taxonomy attributes: spoken languages and career interests.

---

## 2. API Contracts & Mutations
- **Add Skill:** `POST /v1/profile/{username}/skills/`
- **Remove Skill:** `DELETE /v1/profile/{username}/skills/{skill_id}/`
- **Taxonomy Suggestions:** `GET /v1/catalogs/skills/?q={query}`

---

## 3. QC Anti-Regression Selectors
- `[data-testid="skills-card"]`: Outer card container for skills.
- `[data-testid="skill-badge"]`: Individual skill pill/tag element.
- `[data-testid="add-skill-btn"]`: Trigger button for skill autocomplete dialog.
