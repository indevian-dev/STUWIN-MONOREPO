# API Handling & Access Control

## 1. Overview
The API architecture is designed for **consistency, security, and type safety**. It abandons ad-hoc route handlers in favor of a centralized **Interceptor Pattern**. Every request flows through a pipeline that standardizes authentication, context creation, permission validation, and error handling before it ever reaches business logic.

## 2. Key Directories & Files
- **Framework Root:** `frameworks/next/app/api/`
- **Interceptors (The Core):** `frameworks/next/lib/app-access-control/interceptors/` (Central logic for `withApiHandler`)
- **Client Helper:** `frameworks/next/lib/helpers/apiCallForSpaHelper.ts` (Standardized frontend fetch wrapper)
- **Validation:** `frameworks/next/lib/app-core-modules/types/` (Zod schemas or Type definitions)
- **Response Types:** `frameworks/next/lib/app-infrastructure/types/apiTypes.ts` (API Response interfaces)

## 3. Architecture & Patterns

### The `unifiedApiHandler` Pipeline
Every API Route (`route.ts`) MUST wrap its logic in `withApiHandler`. This wrapper performs:
1.  **Auth Verification:** Decodes session tokens.
2.  **Context Injection:** Creates typesafe `ctx` (User ID, Account ID, Permissions).
3.  **Params Injection:** Standardizes `params` availability.
4.  **Logging Injection:** Attaches a request-scoped logger (`ctx.log`).
5.  **Error Catching:** centralized `try/catch` that converts exceptions to standard HTTP error responses (400, 401, 500).

### Standard Response Format
All APIs must return data in this strictly typed JSON structure:
```typescript
type ApiResponse<T> = {
  success: boolean;
  data?: T;       // Present if success: true
  error?: string; // Present if success: false
  meta?: any;     // Optional pagination/debug info
}
```

## 4. Agent Rules (Do's and Don'ts)

- **ALWAYS** use `withApiHandler({ ... })` for API routes. Never export a raw async function `GET/POST`.
- **ALWAYS** use `withPageAuth({ ... })` for Page components (`page.tsx`) to enforce server-side permissions.
- **NEVER** use `NextRequest` or `NextResponse` directly inside the handler logic unless handling streams. Use the provided arguments.
- **NEVER** instantiate services (like `AuthService`) directly. Use the `ModuleFactory(ctx)` to ensure dependencies (DB, Logger, Context) are injected correctly.
- **DO** validation at the start of the handler (e.g., check for missing `body.fields`).
- **DO** use the client-side `apiCallForSpaHelper` for all frontend fetch calls. It handles token refresh and error parsing automatically.
