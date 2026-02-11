-- 1. Refactored Workspaces Table (Entities)
-- Moving from SERIAL ID to ULID (access_key)
CREATE TABLE workspaces (
    access_key TEXT PRIMARY KEY, -- ULID, serves as the main ID
    owner_account_id UUID NOT NULL, -- References auth.users(id) or public.users(id) if strictly defined
    type TEXT NOT NULL, -- 'student', 'school', 'parent', 'content_org'
    title TEXT,
    
    -- Contextual Identity
    display_name TEXT, 
    avatar_url TEXT,
    
    -- Content Source
    content_source_id TEXT REFERENCES workspaces(access_key),

    metadata JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    is_blocked BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. The "Universal Graph" (Permissions)
CREATE TABLE workspace_to_workspace (
    from_access_key TEXT NOT NULL REFERENCES workspaces(access_key),
    to_access_key   TEXT NOT NULL REFERENCES workspaces(access_key),
    
    relation_type   TEXT NOT NULL, -- 'enrollment', 'parenting', 'supervision'
    is_active       boolean DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    
    -- Compound Key for efficient lookup and uniqueness
    PRIMARY KEY (from_access_key, to_access_key)
);

-- 3. Reports (Highload Table)
CREATE TABLE student_reports (
    workspace_access_key TEXT NOT NULL REFERENCES workspaces(access_key), -- Partition Key
    report_ulid          TEXT NOT NULL, -- Sort Key / ID
    
    score                INT,
    data                 JSONB,
    generated_at         TIMESTAMPTZ DEFAULT NOW(),
    week_start           TIMESTAMPTZ,
    week_end             TIMESTAMPTZ,
    
    -- Compound PK for CockroachDB optimization
    PRIMARY KEY (workspace_access_key, report_ulid DESC)
);

-- 4. Refactored Learning Tables (Example adaptation for Questions)
-- Ideally all content tables should use ULIDs now
CREATE TABLE questions (
    id TEXT PRIMARY KEY, -- ULID
    workspace_access_key TEXT REFERENCES workspaces(access_key),
    
    question TEXT,
    answers JSONB,
    correct_answer TEXT,
    complexity TEXT,
    grade_level INT,
    language TEXT,
    is_published BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

-- Migration helpers (if keeping old data is required, custom scripts needed to generating ULIDs)
