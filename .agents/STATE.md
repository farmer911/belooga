# Active Working Memory (`STATE.md`)

## Objective & Expected Outcome
- **Task:** Implement Enterprise Notification & Transactional Email Deep-Link System (Option B) across 3 sequential PR commits (`BEL-506` -> `BEL-508`):
  1. `notifications` + `notification_preferences` tables & vertical module `app/modules/notifications/`.
  2. 7 Domain Event Triggers (Auth, Expert Review, MoMo IPN, ATS/CMS, Job Kanban, Video Pitch) with Email Deep-Links.
  3. Header Notification Bell UI (`notification-bell.tsx`), Settings Email Preference Toggles, and `/forgot-password?token=` Deep-Link landing.

## Pre-Mortem Risks
- **Open-Redirect Guard:** Validate `deep_link` matches `^/[a-zA-Z0-9_\-\?=&/.@%]*$` before storing or building `email_deeplink_url`.
- **Non-Blocking Email Outbox:** Run email dispatch via `asyncio.to_thread` so zero blocking I/O occurs on the async event loop.
- **File Size & Ratchet Caps:** Keep all backend `.py` <= 300 lines and frontend `page.tsx` <= 241 lines (`settings/page.tsx` is 167 lines; extract preferences organism if needed).

## 3-PR Execution Checklist
- [x] **PR 1 (`BEL-506`):** Core Notification Engine (`notifications` & `notification_preferences` tables, `app/modules/notifications/`, `/v1/notifications/*` API, TDD `test_notifications.py`)
- [x] **PR 2 (`BEL-507`):** Domain Event Triggers (Auth reset/password, Expert Review order/checkout, MoMo IPN, Job Kanban Interview/Offer, Career Apply, Video Pitch ready + TDD tests)
- [ ] **PR 3 (`BEL-508`):** Frontend Header Bell (`notification-bell.tsx`), Settings Email Preferences UI (`settings/page.tsx`), & Deep-Link Landing (`forgot-password/page.tsx`)
