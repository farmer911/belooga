# ⏳ Section Skill: Career Timeline & Credentials Management

> [!WARNING] TARGET REFACTORING PATTERN – CURRENTLY INLINED IN APP ROUTER
> **Current Reality:** Inlined in `frontend/src/app/user/[username]/page.tsx` (Career Timeline Section)  
> **Target Modular Path:** frontend/src/components/organisms/workspace/timeline-section.tsx (planned target)  
> **Master Skill:** `fe-page-workspace`  
> **Backend Domain:** Domain 3 (Timeline CRUD & Reordering)  

---

## 1. Scope Boundary

This section maintains responsibility for:
1. Dual-tab career timeline: **Work Experience** and **Education & Credentials**.
2. Complete CRUD lifecycle (Create, Read, Update, Delete) for job and degree entries via modal dialogs.
3. Native HTML5 Drag-and-Drop reordering across the timeline list.
4. Synchronizing the persisted integer sequence (`display_order`) with the backend database.
5. Autocomplete suggestions for company names and universities via Master Catalogs.

---

## 2. Drag-and-Drop Reordering & Optimistic Updates

When a candidate reorders a timeline item:
1. Apply an immediate optimistic UI update to prevent visual latency.
2. Dispatch the updated order array to the backend:
   * **Endpoint:** `POST /v1/profile/{username}/job-experiences/order/`
   * **Payload:**
     ```json
     {
       "orders": [
         { "id": "b3e34b12-9c98-4c8d-9654-7662cf011234", "order": 0 },
         { "id": "a1f28c34-1b23-4e56-8790-123456789abc", "order": 1 }
       ]
     }
     ```
3. Backend acquires pessimistic locks (`SELECT ... FOR UPDATE`) to guarantee transaction safety against race conditions.
4. On `200 OK`, invalidate the query cache:
   ```typescript
   queryClient.invalidateQueries({ queryKey: ["candidate-profile", username] });
   ```

---

## 3. QC Anti-Regression Selectors (Mandatory Preservation)

Playwright E2E tests target these exact timeline selectors:
* `[data-testid="timeline-job-card"]`: Card container for individual job entries (with `draggable="true"`).
* `[data-testid="add-experience-btn"]`: Trigger opening new job modal.
* `[data-testid="add-education-btn"]`: Trigger opening new education modal.
* `[data-testid="dnd-handle"]`: Grip handle icon initiating HTML5 drag.
* `[data-testid="delete-experience-btn"]`: Action deleting a job entry.
* `[data-testid="experience-modal-submit"]`: Form submit button in the modal.

⚠️ **FORBIDDEN:** Replacing native HTML5 Drag-and-Drop with unapproved external libraries (e.g. react-beautiful-dnd) that break Playwright drag-to actions is strictly prohibited.
