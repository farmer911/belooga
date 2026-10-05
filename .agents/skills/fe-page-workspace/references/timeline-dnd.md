# Section Reference: Career Timeline & Drag-and-Drop Reordering

- **Components:** `frontend/src/components/features/timeline/experience-timeline.tsx`, `education-timeline.tsx`, `timeline-item-card.tsx`
- **Hook:** `frontend/src/hooks/use-timeline-dnd.ts`
- **Master Skill:** `fe-page-workspace`
- **Backend Domain:** Domain 3 (Career Timeline)

---

## 1. Scope Boundary
This section maintains responsibility for:
1. Work history (job experiences) and education cards displayed in chronological/custom order.
2. Drag-and-drop reordering using optimistic client-side updates synced via backend order endpoints.
3. Adding and deleting timeline entries. Note: editing is performed via delete + create (no update endpoint exists).

---

## 2. API Contracts & Mutations
- **Add Job:** `POST /v1/profile/{username}/job-experiences/`
- **Delete Job:** `DELETE /v1/profile/{username}/job-experiences/{item_id}/`
- **Reorder Jobs:** `POST /v1/profile/{username}/job-experiences/order/` (array of IDs)
- **Add Education:** `POST /v1/profile/{username}/education/`
- **Delete Education:** `DELETE /v1/profile/{username}/education/{item_id}/`
- **Reorder Education:** `POST /v1/profile/{username}/education/order/`

---

## 3. QC Anti-Regression Selectors
- `[data-testid="experience-timeline"]`: Container for job experiences list.
- `[data-testid="education-timeline"]`: Container for education entries list.
- `[data-testid="timeline-item-card"]`: Card representing an individual job or education item.
- `[data-testid="timeline-drag-handle"]`: Grab handle triggering drag-and-drop.
- `[data-testid="delete-timeline-item-btn"]`: Item deletion button.
- `[data-testid="add-experience-btn"]`: Modal trigger to add a job entry.
