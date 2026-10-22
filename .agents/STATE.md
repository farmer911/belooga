🎯 Đang làm ticket: [BEL-226] (#196) — [FE] Khắc Phục Triệt Để 7 Hành Vi Gian Lận Ở Frontend (#1, #2, #3, #4, #5, #8, #9 Từ Audit #179) | Role: FE | Cột: Testing

- **Ticket:** `#196` (`[BEL-226]`, Kanban Item ID: `PVTI_lAHOAeXQP84BoMSnzhCxl5U`).
- **Branch:** `feature/BEL-226-fe-remediate-deceptions`.
- **Changes Delivered:**
  - Removed fake `valid_sim_sig` IPN webhook call in `momo-checkout-dialog.tsx` and `/simulate-delivery` bypass in `use-wallet.ts`.
  - Removed error-swallowing `catch` blocks fabricating report feedback, comparison boosts, and job edits in `candidate-orders-list.tsx`, `recruiter-comparison-matrix.tsx`, and `workspace/jobs/page.tsx`.
  - Aligned all route calls in `cv-file-parser.ts`, `community-company-suite.tsx`, and `recruiter-tracker-wallet-suite.tsx` 1:1 with real FastAPI endpoints.
  - Replaced hardcoded `"Alex Nguyen"` / `"alex@belooga.com"` / `"alexnguyen"` fallbacks in `careers/page.tsx`, `social-feed-card.tsx`, and `review-booking-dialog.tsx` with `useAuthStore` state.
  - Added TDD unit tests in `frontend/src/__tests__/schemas-and-store.test.ts` (11/11 pass).
- **Verification:** `bun x tsc --noEmit` 0 errors, `bun test` 11/11 pass, `trust-benchmark.py` 100% (0 violations).
