# Auth User Flow

## Key Files
| File | Definition |
|---|---|
| `next/lib/domain/auth/auth.service.ts` | Login, register, password reset, profile update |
| `next/lib/domain/auth/auth.repository.ts` | Account + membership DB queries |
| `next/lib/domain/auth/auth.types.ts` | `AccountEntity`, `MembershipEntity` types |
| `next/lib/domain/auth/auth.inputs.ts` | Zod schemas for login, register, reset |
| `next/lib/domain/auth/otp.service.ts` | OTP generation, validation, expiry |
| `next/lib/domain/auth/otp.repository.ts` | OTP DB queries |
| `next/lib/domain/auth/otp.types.ts` | `OtpType`, `OtpPurpose` |
| `next/lib/domain/auth/verification.service.ts` | Email/phone verification flow |
| `next/lib/domain/auth/password.util.ts` | Hashing, comparison, strength validation |
| `next/lib/middleware/authenticators/IdentityAuthenticator.ts` | JWT decoding, session validation, `AuthData` resolution |
| `next/lib/middleware/authenticators/SessionAuthenticator.ts` | Session cookie management |
| `next/lib/middleware/authenticators/CookieAuthenticator.ts` | Cookie-based auth helpers |
| `next/lib/middleware/authenticators/OAuthAuthenticator.ts` | OAuth flow (Google, etc.) |
| `next/app/api/auth/` | Auth API routes (login, register, verify, reset, OAuth) |

## Identity vs Authorization
- **Identity (Account):** "Who am I?" — managed via session tokens
- **Authorization (Workspace):** "Where can I go?" — managed via membership + role + permissions

## Token Strategy
| Token | Storage | Purpose |
|---|---|---|
| Session Token | HttpOnly cookie | Primary persistence |
| Access Token | Short-lived JWT | Internal request auth |
| Refresh Token | Rotated | Long-lived session renewal |

## Auth Flow
1. User logs in → gets `session_token` cookie
2. Middleware verifies `session_token`
3. User navigates to `/workspaces/<type>/<id>`
4. Interceptor checks membership + role for that workspace
5. ✅ Granted or ❌ Redirected to 403 / Onboarding

## OTP Module
| File | Definition |
|---|---|
| `auth/otp.types.ts` | `OtpType` enum, `OtpPurpose` enum |
| `auth/otp.repository.ts` | Create, find, mark-used OTP records |
| `auth/otp.service.ts` | Generate OTP, validate, handle expiry, rate-limiting |

## Rules
- **ALWAYS** use `AuthService` for login/signup — never raw SQL inserts for users
- **ALWAYS** use `ctx.accountId` / `ctx.userId` from `unifiedApiHandler` — never re-parse cookies
- **ALWAYS** use `OtpService` for OTP flows — never generate OTPs manually
- **NEVER** store sensitive state (`isLoggedIn`) in `localStorage` for security checks
- **NEVER** access `auth.repository` directly from routes — always go through `auth.service`
