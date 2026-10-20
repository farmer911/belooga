# Active Working Memory (`STATE.md`)

## Objective & Expected Outcome
- **Task (`BEL-517`):** Research, Design, and Implement Production Service Worker & PWA Architecture on Frontend (`frontend/public/sw.js`, `frontend/public/manifest.webmanifest`, `frontend/src/components/providers/service-worker-provider.tsx`, and integration with `layout.tsx`, `notification-bell.tsx`, and `cv-studio/page.tsx`):
  1. **Supervisor Guardrails (Zero Auth/PII Leak & Zero 206 Video Range Crash):**
     - Never cache requests carrying `Authorization` headers, `/v1/auth/*`, `/v1/payments/*`, or HTTP `206 Partial Content` video range streams.
  2. **5 High-ROI Service Worker Features Applied:**
     - **SWR Public API Cache (`belooga-api-swr-v1`):** Instant offline/flaky-network resilience for `/v1/catalogs/*`, `/v1/blog/posts/*`, `/v1/faqs`, `/v1/careers/jobs/`, `/v1/profile/search/trending/`.
     - **Static Asset Cache-First (`belooga-static-v1`):** Instant repeat-visit loading for `/images/*` & static assets.
     - **Offline Mutation Outbox & Auto-Replay (`QUEUE_OFFLINE_MUTATION` / `FLUSH_OUTBOX`):** Protects `/cv-studio` cloud draft saves when offline and auto-syncs upon reconnect.
     - **Native Notification & Deep-Link Click Handler (`push` / `notificationclick`):** Opens/focuses deep-link URLs from OS notifications, wired into `NotificationBell`.
     - **PWA Manifest (`manifest.webmanifest`):** App shortcuts & installability metadata in `layout.tsx`.

## Pre-Mortem Risks
- Keep all frontend `page.tsx` <= 241 lines, `fe_arbitrary_hex == 0`, `fe_structural_emoji == 0`.

## Execution Checklist
- [x] Create `frontend/public/sw.js` (Cache-First static, SWR public APIs, Auth/206 bypass, Offline Outbox replay, Push & Deep-link `notificationclick`)
- [x] Create `frontend/public/manifest.webmanifest` and link in `frontend/src/app/layout.tsx`
- [x] Create `frontend/src/components/providers/service-worker-provider.tsx` (SW registration, offline/sync banner, outbox queue helper, native notification trigger)
- [x] Wire SW Native Desktop Notification toggle into `NotificationBell` & Offline Outbox fallback into `cv-studio/page.tsx`
- [x] Verify TypeScript (`bun x tsc --noEmit`), backend pytest, `trust-benchmark.py`, `audit-truth.sh`, open PR #25, and merge into `main`
