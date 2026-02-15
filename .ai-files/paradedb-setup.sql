-- ═══════════════════════════════════════════════════════════════
-- PARADEDB SEARCH SETUP — Run on Neon PgSQL
-- ═══════════════════════════════════════════════════════════════

-- 1. Enable pg_search extension
CREATE EXTENSION IF NOT EXISTS pg_search;

-- 2. Create the search_questions table
CREATE TABLE IF NOT EXISTS search_questions (
    id VARCHAR PRIMARY KEY,
    workspace_id VARCHAR NOT NULL,
    data JSONB NOT NULL,
    synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. BM25 full-text search index over JSONB data column
-- ParadeDB auto-indexes all nested keys (data.question, data.complexity, etc.)
CREATE INDEX search_questions_bm25_idx
ON search_questions
USING bm25 (id, data, workspace_id)
WITH (key_field = 'id');

-- 4. Standard B-tree index for workspace filtering
CREATE INDEX IF NOT EXISTS search_questions_workspace_idx
ON search_questions (workspace_id);
