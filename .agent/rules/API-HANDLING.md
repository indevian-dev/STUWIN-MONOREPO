# API Handling & Access Control

## Key Files
| File | Definition |
|---|---|
| `next/lib/middleware/handlers/ApiInterceptor.ts` | `withApiHandler()` + `unifiedApiHandler()` — core request pipeline |
| `next/lib/middleware/handlers/ViewInterceptor.tsx` | SSR page handler HOC for protected Server Components |
| `next/lib/middleware/handlers/ApiErrorMapper.ts` | Standardized error response formatting |
| `next/lib/routes/RouteFactory.ts` | `createRouteFactory()` + `createEndpoint()` — endpoint config builders |
| `next/lib/routes/types.ts` | `EndpointConfig`, `EndpointsMap`, `ApiHandlerContext`, `AuthValidationData`, `HandlerLogger` |
| `next/lib/routes/api.types.ts` | `ApiValidationResult`, pagination, response, upload, search types |
| `next/lib/routes/helpers.ts` | URL builders, path utilities |
| `next/lib/routes/index.ts` | Barrel — merges all endpoint maps into `allEndpoints` |

## Route Endpoint Config Files
| File | Definition |
|---|---|
| `next/lib/routes/auth/AuthRoutes.ts` | Auth endpoint configs |
| `next/lib/routes/public/PublicRoutes.ts` | Public (no-auth) endpoint configs |
| `next/lib/routes/system/SystemRoutes.ts` | System/admin endpoint configs |
| `next/lib/routes/workspaces/provider/ProviderRoutes.ts` | Provider workspace endpoints |
| `next/lib/routes/workspaces/student/StudentRoutes.ts` | Student workspace endpoints |
| `next/lib/routes/workspaces/staff/StaffRoutes.ts` | Staff workspace endpoints |

## `unifiedApiHandler` Pipeline
Every `route.ts` uses `unifiedApiHandler` which auto-injects fully typed `UnifiedContext`:
| Injected | Type | Purpose |
|---|---|---|
| `module` | `ModuleFactory` | Pre-wired DI container with `AuthContext` |
| `auth` | `AuthContext` | Current user identity + workspace (primary) |
| `ctx` | `AuthContext` | Backward-compat alias for `auth` |
| `authData` | `AuthValidationData` | Session/user/account validation metadata |
| `params` | `Record<string, string>` | URL path parameters |
| `log` | `LoggerInstance` | Request-scoped structured logger |
| `db` | `Database` | Raw database client |
| `isValidSlimId` | `function` | ID format validation utility |
| `requestId` | `string` | Request correlation ID |

## Handler Type Chain
| Type | File | Purpose |
|---|---|---|
| `ApiHandlerContext` | `types.ts` | Low-level — constructed by `withApiHandler`. `ctx: AuthContext`, `log: HandlerLogger`, `authData?: AuthValidationData` |
| `UnifiedContext` | `ApiInterceptor.ts` | High-level — all fields non-optional. Extends with `module`, `auth`, `db`, `isValidSlimId` |
| `HandlerLogger` | `types.ts` | Interface matching Logger methods routes use (info, warn, error, debug, http, apiComplete) |

## API Route Structure (`next/app/api/`)
| Path | Definition |
|---|---|
| `auth/` | Login, register, verify, reset, OAuth |
| `(public)/` | Public APIs (no auth required) |
| `jobs/` | Background job endpoints (QStash receivers) |
| `webhooks/` | Payment + external webhook handlers |
| `workspaces/(root)/` | Workspace CRUD, billing, onboarding |
| `workspaces/provider/[workspaceId]/` | Provider dashboard APIs (subjects, topics, questions) |
| `workspaces/student/[workspaceId]/` | Student APIs (quizzes, homework, sessions) |
| `workspaces/staff/[workspaceId]/` | Staff/admin APIs |

### Staff Workspace Sub-Routes (`workspaces/staff/[workspaceId]/`)
| Sub-Path | Methods | Purpose |
|---|---|---|
| `users/` | GET | List/search users |
| `users/[id]/` | GET, PUT | User details, update account |
| `users/create/` | POST | Create personal account |
| `users/update/` | PUT | Update user verification / password |
| `users/delete/` | DELETE | Delete user |
| `users/assign-provider/` | POST | Assign provider scope to user |
| `roles/` | GET | List all roles |
| `roles/create/` | POST | Create new role |
| `roles/[id]/` | GET, PUT, DELETE | Role CRUD |
| `roles/[id]/permissions/` | PUT | Update role permissions |
| `providers/` | GET | List all providers |
| `providers/[providerId]/` | GET, PATCH, DELETE | Provider details/update/delete |
| `providers/applications/` | GET | List provider applications |
| `providers/applications/update/[applicationId]/` | PUT | Approve/reject application |
| `accounts/search/` | GET | Search accounts |
| `accounts/[id]/workspaces/` | GET | List account workspaces |

## Standard Response Format
```typescript
type ApiResponse<T> = {
  success: boolean;
  data?: T;       // Present if success: true
  error?: string; // Present if success: false
}
```

## Rules
- **ALWAYS** use `unifiedApiHandler` for API routes — never raw `NextRequest` handlers
- **ALWAYS** destructure `{ module, auth, params, log }` from `UnifiedContext` — never `{ ctx }`
- **ALWAYS** validate at the start of the handler (Zod schemas or manual checks)
- **ALWAYS** place API routes in `next/app/api/` — **NEVER** under `next/app/[locale]/api/`
- **ALWAYS** include `[workspaceId]` in all staff/provider/student workspace API paths
- **ALWAYS** type catch clause errors as `unknown` — never `any`
- **NEVER** instantiate `ModuleFactory` directly — use the injected `module` from context
- **NEVER** use `NextResponse` for non-stream responses without the standard format
