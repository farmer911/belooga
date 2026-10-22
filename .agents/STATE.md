🎯 Đang làm ticket: [BEL-146] (#56) — Candidate Shortlist Bookmark Toggle & Saved Shortlist Drawer (/search & /public/[username]) | Role: FE | Cột: In Progress

# Active Working Memory (`STATE.md`)

## Objective & Hypothesis
- **Ticket:** `[BEL-146]` (#56) — Candidate Shortlist Bookmark Toggle & Saved Shortlist Drawer (`/search` & `/public/[username]`).
- **Role:** `FE` (`@fe-lead`, `role:frontend`)
- **Action:** Create `frontend/src/hooks/use-bookmarks.ts` (`@tanstack/react-query` against `GET/POST/DELETE /v1/bookmarks/`), `frontend/src/components/features/search/saved-shortlist-drawer.tsx`, and wire Bookmark toggles on `/search` & `/public/[username]` matching Design Spec `#64`.

## Execution Checklist
- [x] Clear `.agents/STATE.md` (`<= 50` lines) and move `#56` to `In Progress`.
- [ ] Create `use-bookmarks.ts` & `saved-shortlist-drawer.tsx` (`<= 150` lines, semantic tokens, `375px` responsive).
- [ ] Wire Bookmark buttons & Drawer on `search/page.tsx` and `public-header-card.tsx` / `public/[username]/page.tsx`.
- [ ] Verify `tsc --noEmit` & `trust-benchmark.py`, push `feature/BEL-146-fe-bookmarks`, open PR, and move `#56` to `Testing`.
