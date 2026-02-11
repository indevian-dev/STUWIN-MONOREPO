# Database & Scalability

## Key Files
| File | Definition |
|---|---|
| `next/lib/database/schema.ts` | All Drizzle table definitions — single source of truth |
| `next/lib/database/index.ts` | Drizzle client (`db`), `Database` type, `DbClient` type (DB or Transaction) |
| `next/lib/database/migrations/` | SQL migration files (Drizzle Kit managed) |

## Database Stack
| Layer | Technology |
|---|---|
| Database | PostgreSQL |
| ORM | Drizzle ORM |
| Driver | `postgres-js` |
| Types | `Database` (Drizzle instance), `DbClient` (DB or Transaction) |

## Type Exports from `database/index.ts`
| Export | Definition |
|---|---|
| `db` | Singleton Drizzle client instance |
| `Database` | `typeof db` — used for service constructor injection |
| `DbClient` | `Database | Transaction` — used for repository constructor injection |
| `schema` | All table definitions re-exported |

## Multi-Tenancy
- Every workspace-scoped entity **MUST** have a `workspaceId` column
- Indexing should be compound: `index("name").on(table.workspaceId, table.status)`
- No cross-workspace joins unless building Staff/Admin features

## Rules
- **ALWAYS** define schema changes in `next/lib/database/schema.ts` only
- **ALWAYS** use `db.transaction(async (tx) => { ... })` for multi-step writes
- **ALWAYS** respect foreign keys and unique constraints defined in schema
- **NEVER** use `next/drizzle/` — use `next/lib/database/` exclusively
- **NEVER** perform cross-workspace joins in user-facing queries
- **USE** `Soft Delete` (`deletedAt` column) for critical user data unless told otherwise
- **USE** snake_case for database column names, camelCase for TypeScript properties
