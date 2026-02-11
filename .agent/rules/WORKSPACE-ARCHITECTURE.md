---
trigger: always_on
description: Workspace-First architecture — hierarchical tree with scoped access, 4-layer security, multi-vendor scaling.
---

# Workspace-First Architecture

## Key Files
| File | Definition |
|---|---|
| `next/lib/domain/workspace/workspace.service.ts` | Workspace CRUD, enrollment, provider applications |
| `next/lib/domain/workspace/workspace.repository.ts` | Workspace + membership DB queries |
| `next/lib/domain/workspace/workspace.types.ts` | `WorkspaceProfile`, `ProviderListOptions`, `CreateWorkspaceDetails` |
| `next/lib/domain/workspace/workspace.inputs.ts` | Zod schemas for workspace operations |
| `next/lib/domain/role/role.service.ts` | Role + permission management |
| `next/lib/domain/role/role.repository.ts` | Role DB queries |
| `next/lib/middleware/authorizers/` | Permission checks, workspace access validation |
| `next/lib/database/schema.ts` | `workspaces`, `workspace_memberships`, `workspace_roles` table definitions |

## Entity Structure (The Tree)
| Concept | Definition |
|---|---|
| **Workspace** | A node with unique `workspace_access_key` (e.g., `org_node.sub_123`) |
| **parent_workspace_id** | Reference to parent node — creates the tree hierarchy |
| **ui_type** | Interface type: `end_user`, `manager`, `sys_admin` |
| **Account** | User identity (email, password) |
| **Membership** | Links Account → Workspace + assigns Role |
| **Direct Access** | `target_workspace_id === via_workspace_id` — Direct member (Staff/Admin/Director of the workspace) |
| **Linked Access** | `target_workspace_id !== via_workspace_id` (e.g. `via`=StudentPersonal, `target`=Provider) — Enrollment/Subscription |

## Interface Types
| Interface (`ui_type`) | Access Context | Target User |
|---|---|---|
| Admin Dashboard | Entire organization root | Managers, Directors |
| End User Portal | Personal node | Users (and Managers as viewers) |
| Monitor Dashboard | Own hub + related nodes | Supervisors |
| Global Staff | Entire database | Developers / Admins |

## Authorization Flow
1. Middleware extracts `workspace_key` from URL
2. `getAuthContext` queries DB/Redis for user's role in that workspace
3. Generates `allowedKeys` list (single key for user, list for managers)
4. Permission check validates action against role's `permissions` list
5. Cached via React `cache()` per request

## Automatic Data Filtering (`getScopedDb`)
| Role | Filter |
|---|---|
| Users | `WHERE workspace_access_key = 'active_key'` |
| Managers | `WHERE workspace_access_key IN (...)` |
| Staff | No filter |

## 4-Layer Security Shield
1. **Edge Protection (Cloudflare):** DDoS / Bot mitigation
2. **JWT Context:** Request-scoped identity + workspace injection
3. **Scoped Clients:** Auto data filtering by `workspace_access_key`
4. **RLS:** Physical DB constraints preventing cross-workspace leaks

## Rules
- **ALWAYS** scope queries by `workspaceId` for user-facing features
- **ALWAYS** use `AuthContext` from the handler — never parse workspace from raw URL
- **NEVER** perform cross-workspace data access in user-facing code