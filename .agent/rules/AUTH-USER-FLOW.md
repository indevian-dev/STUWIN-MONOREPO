# Auth User Flow

## 1. Overview
Authentication separates **Identity** (Account) from **Authorization** (Workspace Access).
1.  **Identity:** "Who am I?" (Managed via Global Session).
2.  **Authorization:** "Where can I go?" (Managed via Relation Tables & Permissions).

We prioritize **Passwordless OTP (Phone/Email)** for authentication but support passwords for legacy/admin flows.

## 2. Key Directories & Files
- **Auth UI:** `frameworks/next/app/[locale]/auth/` (Login, Register, OTP Verify).
- **Auth Service:** `frameworks/next/lib/app-core-modules/auth/` (Token generation, Hashing).
- **Session Management:** `frameworks/next/lib/app-access-control/session/` (Cookie handling).
- **Interceptors:** `frameworks/next/lib/app-access-control/interceptors/` (JWT Verification).

## 3. Architecture & Patterns

### The "Visitor" Model
Users are "Visitors" to workspaces.
- A user logs in -> Gets a `session_token` cookie.
- Middleware verifies `session_token`.
- User navigates to `/workspaces/user/123`.
- Interceptor checks: Does User(Token) have `User` relation to Workspace `123`?
  - **Yes:** Grant Access.
  - **No:** Redirect to 403 / Onboarding.

### Token Strategy
- **Access Tokens:** Short-lived JWTs (handled internally if needed).
- **Session Tokens:** HttpOnly cookies used for persistence.
- **Refresh Tokens:** Rotated for long-lived sessions.

## 4. Agent Rules (Do's and Don'ts)

- **ALWAYS** use `AuthService` for login/signup logic. Never write raw SQL inserts for users in controllers.
- **ALWAYS** rely on `ctx.accountId` and `ctx.userId` provided by `withApiHandler`. Do not try to re-parse cookies manually in business logic.
- **NEVER** store sensitive user state (like `isLoggedIn` boolean) in `localStorage` for security decisions. Only use it for UI hints.
- **DO** use the `verify` endpoints (`/auth/verify/phone`, `/auth/verify/email`) for the 2-step OTP flow.
- **DO** ensure the `onboarding` flow correctly creates the *first* workspace after a new account is registered.
