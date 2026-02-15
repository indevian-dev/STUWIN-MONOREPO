-- ═══════════════════════════════════════════════════════════════
-- FDW AUTO-SYNC: Supabase → Neon (ParadeDB)
-- Run this on your SUPABASE database
-- ═══════════════════════════════════════════════════════════════
-- This creates a Foreign Data Wrapper so that Supabase can
-- directly write to Neon's search_questions table via a trigger
-- on provider_questions. No app code needed.
-- ═══════════════════════════════════════════════════════════════

-- ┌─────────────────────────────────────┐
-- │  1. ENABLE EXTENSION                │
-- └─────────────────────────────────────┘

CREATE EXTENSION IF NOT EXISTS postgres_fdw;

-- ┌─────────────────────────────────────┐
-- │  2. CREATE FOREIGN SERVER           │
-- │  ⚠️ Replace with your Neon creds    │
-- └─────────────────────────────────────┘

CREATE SERVER neon_search_server
    FOREIGN DATA WRAPPER postgres_fdw
    OPTIONS (
        host 'ep-bold-tree-agm8atoy.c-2.eu-central-1.aws.neon.tech',
        port '5432',
        dbname 'neondb'
    );

-- ┌─────────────────────────────────────┐
-- │  3. USER MAPPING                    │
-- │  ⚠️ Replace with your Neon creds    │
-- └─────────────────────────────────────┘

CREATE USER MAPPING FOR postgres
    SERVER neon_search_server
    OPTIONS (
        user 'neondb_owner',
        password 'npg_Vw6d3lkIEpis'
    );

-- ┌─────────────────────────────────────┐
-- │  4. FOREIGN TABLE                   │
-- │  Maps to Neon's search_questions    │
-- └─────────────────────────────────────┘

CREATE FOREIGN TABLE neon_search_questions (
    id VARCHAR NOT NULL,
    workspace_id VARCHAR NOT NULL,
    data JSONB NOT NULL,
    synced_at TIMESTAMPTZ NOT NULL
)
SERVER neon_search_server
OPTIONS (
    schema_name 'public',
    table_name 'search_questions'
);

-- ┌─────────────────────────────────────┐
-- │  5. TRIGGER FUNCTION                │
-- │  Builds JSONB + upserts/deletes     │
-- └─────────────────────────────────────┘

CREATE OR REPLACE FUNCTION sync_question_to_neon()
RETURNS trigger AS $$
DECLARE
    jsonb_data JSONB;
BEGIN
    -- On DELETE: remove from Neon
    IF TG_OP = 'DELETE' THEN
        DELETE FROM neon_search_questions WHERE id = OLD.id;
        RETURN OLD;
    END IF;

    -- On INSERT / UPDATE: auto-capture ALL columns as JSONB
    -- No hardcoded fields — any new columns are included automatically
    jsonb_data := to_jsonb(NEW);

    -- Upsert into Neon's search_questions via FDW
    -- FDW doesn't support ON CONFLICT, so delete-then-insert
    DELETE FROM neon_search_questions WHERE id = NEW.id;
    INSERT INTO neon_search_questions (id, workspace_id, data, synced_at)
    VALUES (NEW.id, COALESCE(NEW.workspace_id, ''), jsonb_data, NOW());

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ┌─────────────────────────────────────┐
-- │  6. ATTACH TRIGGER                  │
-- └─────────────────────────────────────┘

CREATE TRIGGER trg_sync_questions_to_neon
    AFTER INSERT OR UPDATE OR DELETE
    ON provider_questions
    FOR EACH ROW
    EXECUTE FUNCTION sync_question_to_neon();

-- ═══════════════════════════════════════════════════════════════
-- DONE! Every INSERT/UPDATE/DELETE on provider_questions
-- will now automatically sync to Neon's search_questions table.
-- ═══════════════════════════════════════════════════════════════
