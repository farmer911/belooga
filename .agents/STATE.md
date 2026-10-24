🎯 Đang làm ticket: [BEL-229] (#206) — [TICKET-01] [P0 - FE] Xử lý lỗi tường minh tại 4 vị trí catch {} nghiệp vụ (ats-diagnostics, search, review-booking-dialog) | Role: FE | Cột: Testing

- **Ticket:** `#206` (`[BEL-229]`, Kanban Item ID: `PVTI_lAHOAeXQP84BoMSnzhDLjHI`).
- **Branch:** `feature/BEL-229-fe-explicit-error-handling` (PR `#212`).
- **QC Feedback Resolved:** Preserved `href="/login"` on `<Link>` in `review-booking-dialog.tsx` for Playwright selector `a[href="/login"]:has-text("Login to Continue")` (`TC-EXREV-003`) while handling `sessionStorage.setItem` errors in `catch (err: unknown)` with fallback redirect `/login?return_to=%2Fexpert-review`.
- **Verification:** `bun test` (13/13 pass), `bun x tsc --noEmit` (0 errors), `trust-benchmark.py` (100%, 0 violations).
