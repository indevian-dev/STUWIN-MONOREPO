# Search Database Setup Guide (Supabase → Neon + ParadeDB)

## AI Prompt Instructions

Use this as a step-by-step guide to set up a separate search database using Neon PostgreSQL + ParadeDB BM25 indexing, with automatic sync from a Supabase primary database via Foreign Data Wrapper (FDW).

---

## Overview

```
Supabase (primary DB)
    ↓ FDW trigger (automatic, per-row)
Neon PgSQL (search DB)
    ↓ ParadeDB pg_search extension
BM25 full-text search index on JSONB
```

**Key design decisions:**
- Data is stored as a single **JSONB column** in Neon — schema-agnostic, no migrations needed on the search side when the source table changes.
- Sync uses **postgres_fdw** with `to_jsonb(NEW)` — automatically captures all columns, zero maintenance.
- The search DB is **read-optimized** — the app only writes to Supabase, Neon receives data via the trigger.

---

## Step 1: Set Up Neon Database

1. Create a Neon project at https://neon.tech
2. Enable the ParadeDB `pg_search` extension
3. Create the search table + BM25 index

```sql
-- Run on NEON

CREATE EXTENSION IF NOT EXISTS pg_search;

-- Replace "search_<entity>" with your entity name (e.g. search_products, search_articles)
CREATE TABLE IF NOT EXISTS search_<entity> (
    id VARCHAR PRIMARY KEY,
    workspace_id VARCHAR NOT NULL,    -- or any scoping/tenant column
    data JSONB NOT NULL,
    synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- BM25 full-text search index
-- ParadeDB auto-indexes all nested JSONB keys
CREATE INDEX search_<entity>_bm25_idx
ON search_<entity>
USING bm25 (id, data, workspace_id)
WITH (key_field = 'id');

-- Standard index for scoping/filtering
CREATE INDEX IF NOT EXISTS search_<entity>_workspace_idx
ON search_<entity> (workspace_id);
```

---

## Step 2: Set Up FDW on Supabase (Auto-Sync)

Run this on your **Supabase** database. Replace placeholders with your Neon credentials and source table name.

```sql
-- Run on SUPABASE

-- 1. Enable FDW extension
CREATE EXTENSION IF NOT EXISTS postgres_fdw;

-- 2. Create foreign server pointing to Neon
CREATE SERVER neon_search_server
    FOREIGN DATA WRAPPER postgres_fdw
    OPTIONS (
        host '<YOUR_NEON_HOST>.neon.tech',
        port '5432',
        dbname '<YOUR_NEON_DB_NAME>'
    );

-- 3. User mapping (Neon credentials)
CREATE USER MAPPING FOR postgres
    SERVER neon_search_server
    OPTIONS (
        user '<YOUR_NEON_USER>',
        password '<YOUR_NEON_PASSWORD>'
    );

-- 4. Foreign table (local alias pointing to Neon's real table)
CREATE FOREIGN TABLE neon_search_<entity> (
    id VARCHAR NOT NULL,
    workspace_id VARCHAR NOT NULL,
    data JSONB NOT NULL,
    synced_at TIMESTAMPTZ NOT NULL
)
SERVER neon_search_server
OPTIONS (
    schema_name 'public',
    table_name 'search_<entity>'
);

-- 5. Trigger function
--    to_jsonb(NEW) auto-captures ALL columns as snake_case JSONB keys.
--    No hardcoded fields — any schema changes on the source table are
--    automatically reflected in the JSONB data.
CREATE OR REPLACE FUNCTION sync_<entity>_to_neon()
RETURNS trigger AS $$
DECLARE
    jsonb_data JSONB;
BEGIN
    IF TG_OP = 'DELETE' THEN
        DELETE FROM neon_search_<entity> WHERE id = OLD.id;
        RETURN OLD;
    END IF;

    jsonb_data := to_jsonb(NEW);

    -- FDW doesn't support ON CONFLICT, so delete-then-insert
    DELETE FROM neon_search_<entity> WHERE id = NEW.id;
    INSERT INTO neon_search_<entity> (id, workspace_id, data, synced_at)
    VALUES (NEW.id, COALESCE(NEW.workspace_id, ''), jsonb_data, NOW());

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Attach trigger to source table
CREATE TRIGGER trg_sync_<entity>_to_neon
    AFTER INSERT OR UPDATE OR DELETE
    ON <source_table_name>
    FOR EACH ROW
    EXECUTE FUNCTION sync_<entity>_to_neon();
```

> **Note:** Replace `<entity>` with your entity name and `<source_table_name>` with the actual Supabase table being synced.

---

## Step 3: Initial Data Sync (One-Time Script)

After setting up the FDW trigger, existing rows need a one-time bulk sync. Run with Bun/Node:

```typescript
import postgres from "postgres";
import "dotenv/config";

const supabase = postgres(process.env.DATABASE_URL!);
const searchDb = postgres(process.env.SEARCH_DATABASE_URL!);

async function main() {
    const rows = await supabase`SELECT * FROM <source_table_name>`;
    console.log(`Found ${rows.length} rows`);

    await searchDb`TRUNCATE search_<entity>`;

    let synced = 0;
    for (const row of rows) {
        try {
            await searchDb`
                INSERT INTO search_<entity> (id, workspace_id, data, synced_at)
                VALUES (${row.id}, ${row.workspace_id || ''}, ${JSON.stringify(row)}::jsonb, NOW())
            `;
            synced++;
        } catch (err) {
            console.error(`Failed: ${row.id}`, err instanceof Error ? err.message : err);
        }
    }

    console.log(`Synced: ${synced}/${rows.length}`);
    await supabase.end();
    await searchDb.end();
}

main();
```

---

## Step 4: App Integration (TypeScript / Next.js)

### 4a. Search DB Client

```typescript
// lib/integrations/paradedb/paradedb.client.ts
import postgres from "postgres";

export const paradeDbClient = postgres(process.env.SEARCH_DATABASE_URL!, {
    max: 5,
    idle_timeout: 30,
});
```

### 4b. Search Repository

```typescript
// lib/domain/search/search.repository.ts
import { paradeDbClient } from "@/lib/integrations/paradedb/paradedb.client";

export class SearchRepository {

    // BM25 full-text search
    async search(params: {
        query: string;
        workspaceId: string;
        filters?: Record<string, string | number | boolean>;
        page?: number;
        pageSize?: number;
    }) {
        const page = params.page || 1;
        const pageSize = params.pageSize || 20;
        const offset = (page - 1) * pageSize;

        // Build ParadeDB BM25 query
        // Field names are snake_case (from to_jsonb)
        const searchParts: string[] = [];
        if (params.query) {
            const escaped = params.query.replace(/[+\-&|!(){}[\]^"~*?:\\/]/g, '\\$&');
            searchParts.push(`data.<text_field>:${escaped}`);
        }

        const filterParts: string[] = [];
        if (params.filters) {
            for (const [key, value] of Object.entries(params.filters)) {
                filterParts.push(`data.${key}:${value}`);
            }
        }

        const mustClause = searchParts.length > 0 ? searchParts.join(' AND ') : '*';
        const filterClause = filterParts.length > 0 ? ` AND ${filterParts.join(' AND ')}` : '';
        const fullQuery = `${mustClause}${filterClause}`;

        const results = await paradeDbClient`
            SELECT id, data, paradedb.score(id) AS score
            FROM search_<entity>
            WHERE data @@@ ${fullQuery}
              AND workspace_id = ${params.workspaceId}
            ORDER BY score DESC
            LIMIT ${pageSize} OFFSET ${offset}
        `;

        const countResult = await paradeDbClient`
            SELECT COUNT(*)::int AS total
            FROM search_<entity>
            WHERE data @@@ ${fullQuery}
              AND workspace_id = ${params.workspaceId}
        `;

        return { results, total: countResult[0]?.total || 0 };
    }

    // Random selection with JSONB filters (for quiz-like features)
    async getRandom(params: {
        workspaceId: string;
        limit: number;
        filters?: Record<string, string | number | boolean>;
    }) {
        const conditions = [`workspace_id = '${params.workspaceId}'`];

        if (params.filters) {
            for (const [key, value] of Object.entries(params.filters)) {
                if (typeof value === 'boolean') {
                    conditions.push(`(data->>'${key}')::boolean = ${value}`);
                } else if (typeof value === 'number') {
                    conditions.push(`(data->>'${key}')::int = ${value}`);
                } else {
                    conditions.push(`data->>'${key}' = '${value}'`);
                }
            }
        }

        const results = await paradeDbClient.unsafe(`
            SELECT id, data FROM search_<entity>
            WHERE ${conditions.join(' AND ')}
            ORDER BY RANDOM()
            LIMIT ${params.limit}
        `);

        return results.map(r => ({ ...(r.data as Record<string, unknown>), id: r.id }));
    }
}
```

### 4c. Environment Variable

```env
SEARCH_DATABASE_URL=postgresql://<user>:<password>@<host>.neon.tech/<dbname>?sslmode=require
```

---

## Key Points

| Topic | Detail |
|-------|--------|
| **JSONB keys** | Always snake_case (from `to_jsonb(NEW)`) |
| **Schema changes** | Add columns to source table → auto-included in JSONB, no updates needed |
| **BM25 syntax** | `data.<field_name>:<search_term>` for text, `data.<field>:<value>` for filters |
| **FDW limitation** | No `ON CONFLICT` — use delete-then-insert pattern |
| **Fallback** | Always keep a Supabase fallback query in case Neon is unreachable |
| **Scoping** | Always filter by `workspace_id` (or your tenant column) |

---

## Checklist for New Project

- [ ] Create Neon project + enable `pg_search`
- [ ] Create `search_<entity>` table + BM25 index on Neon
- [ ] Add `SEARCH_DATABASE_URL` to `.env`
- [ ] Enable `postgres_fdw` on Supabase
- [ ] Create foreign server, user mapping, foreign table
- [ ] Create trigger function with `to_jsonb(NEW)`
- [ ] Attach trigger to source table
- [ ] Run one-time bulk sync script
- [ ] Create ParadeDB client in app
- [ ] Create search repository with BM25 queries
- [ ] Create search service + API routes
- [ ] Test: create/update/delete a row and verify it appears in Neon
