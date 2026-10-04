---
name: fe-page-auth
description: Authoritative Department Skill for the Identity & Authentication Pages (/login, /register, /forgot-password, /callback). Covers split-screen brand layout, form validation, availability checks, HttpOnly cookies, and Zustand auth token persistence.
---

# 🔐 Department Skill: Identity & Authentication (`/(auth)/...`)

> **Department:** Frontend Product Engineering — Identity & Access Division  
> **Routes:** `frontend/src/app/(auth)/login/`, `register/`, `forgot-password/`, `callback/`  
> **Type:** Protected Authentication & Candidate Onboarding Workflows  

---

## 1. Department Role & Mission

The Auth Department guards entry into the platform, onboarding new candidates through registration, verifying credential uniqueness, authenticating returning users, and managing password recovery.

### Sub-Route Hierarchy:
```
frontend/src/app/(auth)/
│
├── login/page.tsx               # Email/password authentication & social OAuth triggers
├── register/page.tsx            # Multi-step candidate registration with real-time uniqueness check
├── forgot-password/page.tsx     # Password recovery email request form
└── callback/page.tsx            # OAuth return handler synchronizing JWT into Zustand
```

---

## 2. Cross-Departmental Impact Matrix (Dependencies)

| Dependency Direction | Department | Interface & Contract |
| :--- | :--- | :--- |
| **Upstream (Depends on)** | `be-service-auth` | `POST /v1/auth/login/`, `POST /v1/users/register/`, `GET /v1/users/exists/email/`, `GET /v1/users/exists/username/` |
| **Downstream (Outputs to)** | `frontend/src/store/auth-store.ts` | In-memory token storage: `{ token, user, setAuth, logout }` |
| **Downstream (Outputs to)** | `fe-page-workspace` | On successful authentication, router redirects candidate to `/user/[username]` |

---

## 3. Strict Security & Token Storage Standards

1. **In-Memory JWT Access Token:**
   - The short-lived JWT access token MUST be stored strictly in-memory inside Zustand (`auth-store.ts`).
   - **NEVER** save access tokens in `localStorage` or `sessionStorage` (vulnerable to XSS extraction).
2. **HttpOnly Refresh Cookies:**
   - The persistent refresh token is managed via an encrypted `HttpOnly`, `SameSite=Lax`, `Secure` cookie issued directly by the backend.
3. **Split-Screen Design System Standard:**
   - All auth pages maintain a split-screen layout: Brand value presentation on the left, responsive credential form on the right.

---

## 4. QC Selectors & Automated Test Assertions

Playwright test suite `qc/tests/e2e/auth-flow.spec.ts` verifies:
* `[data-testid="login-email-input"]`: Email field in login form.
* `[data-testid="login-password-input"]`: Password field in login form.
* `[data-testid="login-submit-btn"]`: Login submit button.
* `[data-testid="register-username-input"]`: Desired username input in registration.
* `[data-testid="register-email-input"]`: Email input in registration.
* `[data-testid="register-password-input"]`: Password input in registration.
* `[data-testid="register-submit-btn"]`: Register submit button.
* `[data-testid="auth-error-banner"]`: Displays validation or credential errors.

---

## 5. Post-Feature Self-Updating Protocol

Whenever modifying the Auth flows:
1. Verify both successful login and invalid password error handling.
2. Confirm username/email availability debounce prevents excessive backend hits.
3. Test session persistence across page refreshes via `/v1/users/refresh/`.
