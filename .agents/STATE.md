# Active Working Memory (`STATE.md`)

## Objective & Expected Outcome
- **Task (Harden `.env` Security, Fix `MOMO_SECRET_KEY` / `CORS_ORIGINS` Drift & Add `.env.example` SSOT Gate):**
  1. **Fix Secret & CORS Drift (`backend/app/modules/payments/service.py`, `backend/app/main.py`):** Enforce `RuntimeError` if `MOMO_SECRET_KEY` is missing in `production`/`prod`/`staging`, and wire `CORS_ORIGINS` from `os.getenv("CORS_ORIGINS")` into `CORSMiddleware`.
  2. **Sync `.env.example` & `.gitignore`:** Document all 11 missing env variables in `.env.example` and ignore `.env.*` (`!.env.example`) in `.gitignore`.
  3. **Automated Env SSOT & GitHub Secret Scanning (`scripts/trust-benchmark.py`, `docs/VIOLATIONS_REGISTER.md`):** Add AST/regex gate in `trust-benchmark.py` verifying every `os.getenv(...)` in `backend/app/` and `process.env.NEXT_PUBLIC_*` in `frontend/src/` is documented in `.env.example`, log `VIOLATION-009`, and enable `secret_scanning_non_provider_patterns` + `secret_scanning_validity_checks` on GitHub.

## Pre-Mortem Risks
- Ensure `MOMO_SECRET_KEY` validation runs both at module import/helper call and in `conftest.py` (`ENVIRONMENT=testing`) without breaking hermetic pytest suites.

## Execution Checklist
- [x] Write failing TDD tests in `backend/tests/test_momo_payment.py` for `MOMO_SECRET_KEY` production guard & `CORS_ORIGINS`
- [x] Harden `backend/app/modules/payments/service.py` and `backend/app/main.py` (Green phase)
- [x] Update `.env.example` (11 missing vars) and `.gitignore` (`.env.*` with `!.env.example`)
- [x] Add `.env.example` SSOT parity & unguarded secret check to `scripts/trust-benchmark.py` + `VIOLATION-009`
- [x] Configure GitHub Variables, push PR, pass CI, and merge
