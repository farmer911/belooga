# Active Working Memory (`STATE.md`)

## Objective & Expected Outcome
- **Task:** Close all 5 remaining Architecture Gaps in `CURRENT_STATE.md` §6 (`BEL-501` -> `BEL-505`). Deliver each gap as a standalone feature branch, TDD Red-Green test, SSOT sync, and merged GitHub PR commit.

## Pre-Mortem Risks
- **300-Line Backend Cap (`be_files_over_300_lines = 0`):** `backend/app/modules/auth/service.py` is 227 lines; apply Ponytail compression so `service.py` and `repository.py` stay well under 300 lines.
- **IDOR & Public Mutation Whitelist:** Authenticate account settings mutations (`Depends(get_current_user)` + `verify_profile_owner`); register public auth/career endpoints in `PUBLIC_MUTATIONS_WHITELIST` (`scripts/trust-benchmark.py` & `scripts/audit-truth.sh`).
- **Frontend Ratchet:** Keep all `page.tsx` <= 241 lines, 0 arbitrary hex, 0 emojis, and use `@tanstack/react-query` (never `apiClient` in `useEffect`).

## 5-Feature PR Execution Checklist
- [x] **Feature 1 (`BEL-501`):** Password Recovery (`password_reset_tokens` DB endpoints + `/forgot-password` UI + PR #1)
- [x] **Feature 2 (`BEL-502`):** Account Settings (`POST /v1/users/{username}/password/`, `DELETE /v1/users/{username}/` + `/user/[username]/settings` UI + PR #2)
- [x] **Feature 3 (`BEL-503`):** OAuth SSO Callback (`social_accounts` exchange `POST /v1/auth/oauth/callback/` + `/callback` UI + PR #3)
- [ ] **Feature 4 (`BEL-504`):** PostgreSQL Master Catalogs (`catalog_companies`, `catalog_schools`, `catalog_locations` DB queries & seed + PR #4)
- [ ] **Feature 5 (`BEL-505`):** Public CMS Careers & Applications (`career_postings` & `career_applications` `POST /v1/career/jobs/{job_id}/apply/` + `/careers` UI + PR #5)
