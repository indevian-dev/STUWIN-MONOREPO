# Workspace Architecture

## 1. Overview
We utilize a **Workspace-First** architecture. This means "Workspace" is the primary boundary for data, permissions, and navigation. A single User Account can belong to multiple Workspaces (e.g., as a Student in one, a Provider in another, and a Parent in a third).

## 2. Key Directories & Files
- **Route Root:** `frameworks/next/app/[locale]/workspaces/`
- **Student Space:** `frameworks/next/app/[locale]/workspaces/student/[workspaceId]/`
- **Provider Space:** `frameworks/next/app/[locale]/workspaces/provider/[workspaceId]/`
- **Workspace Module:** `frameworks/next/lib/app-core-modules/workspace/`
- **Middleware:** `frameworks/next/middleware.ts`

## 3. Architecture & Patterns

### The URL is the Source of Truth
- Format: `/workspaces/[type]/[workspaceId]/...`
- `[type]`: Defines the "Role Mode" (student, provider, parent).
- `[workspaceId]`: Defines the exact data bucket.

### Scoped Access Logic
1.  **Middleware:** Checks if the user is authenticated.
2.  **Interceptor (`withPageAuth`):** Checks if the user *belongs* to `[workspaceId]` and has the `[type]` role.
3.  **Service Layer:** All DB queries *must* include `where: { workspaceId: ... }`.

## 4. Agent Rules (Do's and Don'ts)

- **ALWAYS** include `workspaceId` in every database query (Reading or Writing). Failing to do so leaks data between tenants.
- **ALWAYS** use the URL `params.workspaceId` as the context, never assume a "current workspace" stored in a generic cookie without validating it matches the URL.
- **NEVER** hardcode `/dashboard` links. Always construct links dynamically: `/workspaces/${type}/${workspaceId}/dashboard`.
- **DO** ensure that `WorkspaceService.verifyAccess(userId, workspaceId)` is called before returning sensitive data.
- **DO** treat `onboarding` as a special workspace-creation flow outside the standard layout structure.
