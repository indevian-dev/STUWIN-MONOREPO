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

## Search Database (Neon + ParadeDB)

### Architecture
| Layer | Technology |
|---|---|
| Search Database | Neon PostgreSQL |
| Search Extension | ParadeDB `pg_search` (BM25 indexing) |
| Data Format | Single JSONB column (`data`) per entity |
| Sync Mechanism | FDW trigger (`to_jsonb(NEW)`) — Supabase → Neon |
| Driver | `postgres-js` via `paradeDbClient` |

### Key Files
| File | Definition |
|---|---|
| `next/lib/integrations/paradedb/paradedb.client.ts` | Neon connection client |
| `next/lib/domain/search/search.repository.ts` | BM25 search + JSONB filtered queries |
| `next/lib/domain/search/search.service.ts` | Search business logic |
| `.ai-files/supabase-fdw-sync.sql` | FDW setup SQL (run on Supabase) |
| `.ai-files/paradedb-setup.sql` | Neon table + BM25 index SQL |

### FDW Auto-Sync Flow
```
Supabase: INSERT/UPDATE/DELETE on provider_questions
    → AFTER trigger: sync_question_to_neon()
    → to_jsonb(NEW) captures ALL columns as snake_case JSONB
    → FDW writes to Neon's search_questions via foreign table
```

### Rules
- **NEVER** sync via app code — FDW trigger handles all sync automatically
- **ALWAYS** use snake_case for JSONB field references (matches `to_jsonb` output)
- **ALWAYS** scope search queries by `workspace_id`
- **ALWAYS** include a Supabase fallback when querying Neon (in case of outage)
- **ENV** `SEARCH_DATABASE_URL` connects to Neon (direct, not pooler)

