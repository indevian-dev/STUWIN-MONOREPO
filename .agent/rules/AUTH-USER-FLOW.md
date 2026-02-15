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
| `next/lib/middleware/authenticators/SessionStore.ts` | Redis-backed session management (create, validate, refresh, destroy) |
| `next/lib/middleware/authenticators/CookieAuthenticator.ts` | Cookie-based auth helpers |
| `next/lib/middleware/authenticators/OAuthAuthenticator.ts` | OAuth flow (Google, etc.) |
| `next/lib/middleware/authorizers/CoreAuthorizer.ts` | Request validation — returns `ApiValidationResult` with `AuthContext` + `AuthValidationData` |
| `next/lib/routes/types.ts` | `AuthValidationData` — session/user/account metadata |
| `next/app/api/auth/` | Auth API routes (login, register, verify, reset, OAuth) |

## Identity vs Authorization
- **Identity (Account):** "Who am I?" — managed via session tokens
- **Authorization (Workspace):** "Where can I go?" — managed via membership + role + permissions

## Token Strategy
| Token | Storage | Purpose |
|---|---|---|
| Session Token | HttpOnly cookie + Redis via `SessionStore` | Primary persistence |
| Access Token | Short-lived JWT | Internal request auth |
| Refresh Token | Rotated | Long-lived session renewal |

## Auth Data Types
| Type | File | Purpose |
|---|---|---|
| `AuthContext` | `base/types.ts` | `userId`, `accountId`, `permissions`, `activeWorkspaceId` — injected into services |
| `AuthValidationData` | `routes/types.ts` | `user`, `account`, `session` objects — validation metadata from `CoreAuthorizer` |
| `HandlerLogger` | `routes/types.ts` | Typed logger interface for route handlers |

## Auth Flow
1. User logs in → `SessionStore.create()` stores session in Redis → `session_token` cookie set
2. `CoreAuthorizer.validateEndpointRequest()` validates session via `SessionStore.validate()`
3. Returns `ApiValidationResult` with `AuthContext` + `AuthValidationData`
4. `withApiHandler` constructs `ApiHandlerContext` (guest fallback if no auth)
5. `unifiedApiHandler` wraps into `UnifiedContext` with guaranteed non-optional fields
6. Route handler receives `{ auth, module, authData, log, params }`

## OTP Module
| File | Definition |
|---|---|
| `auth/otp.types.ts` | `OtpType` enum, `OtpPurpose` enum |
| `auth/otp.repository.ts` | Create, find, mark-used OTP records |
| `auth/otp.service.ts` | Generate OTP, validate, handle expiry, rate-limiting |

## Rules
- **ALWAYS** use `AuthService` for login/signup — never raw SQL inserts for users
- **ALWAYS** use `auth.accountId` / `auth.userId` from `UnifiedContext` — never re-parse cookies
- **ALWAYS** use `SessionStore` for session operations (create, validate, refresh, destroy)
- **ALWAYS** use `OtpService` for OTP flows — never generate OTPs manually
- **NEVER** store sensitive state (`isLoggedIn`) in `localStorage` for security checks
- **NEVER** access `auth.repository` directly from routes — always go through `auth.service`
