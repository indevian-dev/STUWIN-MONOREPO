# API Handling & Access Control

## Key Files
| File | Definition |
|---|---|
| `next/lib/middleware/handlers/ApiInterceptor.ts` | `withApiHandler()` + `unifiedApiHandler()` — core request pipeline |
| `next/lib/middleware/handlers/ViewInterceptor.tsx` | SSR page handler for server components |
| `next/lib/middleware/handlers/ApiErrorMapper.ts` | Standardized error response formatting |
| `next/lib/routes/RouteFactory.ts` | `createRouteFactory()` + `createEndpoint()` — endpoint config builders |
| `next/lib/routes/types.ts` | `EndpointConfig`, `EndpointsMap` type definitions |
| `next/lib/routes/api.types.ts` | `ApiHandlerContext`, `ApiValidationResult` types |
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
Every `route.ts` uses `unifiedApiHandler` which auto-injects:
| Injected | Type | Purpose |
|---|---|---|
| `module` | `ModuleFactory` | Pre-wired DI container with `AuthContext` |
| `auth` | `AuthContext` | Current user identity + workspace |
| `db` | `Database` | Raw database client |
| `params` | `Record` | URL path parameters |
| `log` | `Logger` | Request-scoped structured logger |
| `isValidSlimId` | `function` | ID format validation utility |

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
- **ALWAYS** validate at the start of the handler (Zod schemas or manual checks)
- **ALWAYS** place API routes in `next/app/api/` — **NEVER** under `next/app/[locale]/api/`
- **ALWAYS** include `[workspaceId]` in all staff/provider/student workspace API paths
- **NEVER** instantiate services directly — use the injected `module` factory
- **NEVER** use `NextResponse` for non-stream responses without the standard format
