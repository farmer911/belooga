---
name: be-service-auth
description: Identity, authentication, JWT tokens, and refresh session vault in backend/app/api/v1/endpoints/auth.py. Use when updating login, registration, password hashing, JWT creation, or refresh token family rotation. Not for candidate profile attributes (be-service-profile) or frontend auth forms (fe-page-auth).
---

# Identity & Authentication Vault (Domain 1)

## Current Reality (AS-IS)
- Implemented in `backend/app/api/v1/endpoints/auth.py` and `backend/app/core/security.py`.
- No separate service/repository layer; queries execute directly via `AsyncSession` and raw SQL `text(...)`.
- Tables in `backend/initdb.sql`: `identities`, `refresh_sessions`, `social_accounts`, `password_reset_tokens`, `email_verification_tokens`.

## Project-Specific Rules
- **Argon2id Hashing:** Always use `pwdlib` (`PasswordHash.recommended()`) for password verification and hashing.
- **Refresh Token Family Rotation:**
  - Stored in `refresh_sessions`.
  - On refresh (`POST /v1/auth/refresh/`), lock row with `SELECT ... FOR UPDATE`.
  - Enforce 15-second grace window to allow concurrent client requests.
  - If a revoked token is used outside the grace window, revoke all sessions belonging to `family_id` (replay detection) and delete the HttpOnly cookie.
- **Access Tokens:** Issued as HMAC-SHA256 JWTs with 15-minute expiration. Returned in JSON body, stored in-memory by frontend client.

## Known Traps
- Always hash refresh tokens (`token_hash = sha256(raw_token)`) before DB lookup; never store plaintext tokens in `refresh_sessions`.
- The refresh cookie must be set with `httponly=True`, `samesite="lax"`, and `secure=False` (in local development).

## Canonical Example
- `backend/app/api/v1/endpoints/auth.py:refresh_tokens`

## Self-Verification
- `backend/.venv/bin/pytest backend/tests/test_auth_family_rotation.py -v`
- `bash scripts/audit-truth.sh`
