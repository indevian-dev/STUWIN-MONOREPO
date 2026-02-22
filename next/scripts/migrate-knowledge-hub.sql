-- Knowledge Hub Migration
-- Run this script against your Supabase database

-- 1. Ensure pgvector extension exists
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Add topic_vector column to provider_subject_topics
ALTER TABLE provider_subject_topics
ADD COLUMN IF NOT EXISTS topic_vector vector(768);

-- 3. Add new columns to provider_knowledge_hubs
ALTER TABLE provider_knowledge_hubs
ADD COLUMN IF NOT EXISTS total_entries integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';

-- 4. Create student_knowledge_hub_entries
CREATE TABLE IF NOT EXISTS student_knowledge_hub_entries (
    id varchar PRIMARY KEY,
    student_account_id varchar NOT NULL REFERENCES accounts(id),
    workspace_id varchar NOT NULL REFERENCES workspaces(id),
    provider_subject_id varchar REFERENCES provider_subjects(id),
    topic_id varchar REFERENCES provider_subject_topics(id),
    source_type varchar NOT NULL,
    source_id varchar,
    content_summary text,
    content_vector vector(768),
    mastery_signal real,
    metadata jsonb DEFAULT '{}',
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Create provider_knowledge_hub_entries
CREATE TABLE IF NOT EXISTS provider_knowledge_hub_entries (
    id varchar PRIMARY KEY,
    provider_workspace_id varchar NOT NULL REFERENCES workspaces(id),
    provider_subject_id varchar REFERENCES provider_subjects(id),
    topic_id varchar REFERENCES provider_subject_topics(id),
    source_type varchar NOT NULL,
    aggregated_vector vector(768),
    student_count integer DEFAULT 0,
    average_mastery_signal real,
    metadata jsonb DEFAULT '{}',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 6. Create custom_learning_goals
CREATE TABLE IF NOT EXISTS custom_learning_goals (
    id varchar PRIMARY KEY,
    student_account_id varchar NOT NULL REFERENCES accounts(id),
    workspace_id varchar NOT NULL REFERENCES workspaces(id),
    title text NOT NULL,
    goal_vector vector(768),
    created_by varchar NOT NULL DEFAULT 'student',
    status varchar NOT NULL DEFAULT 'active',
    deadline timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 7. Create custom_goal_topics
CREATE TABLE IF NOT EXISTS custom_goal_topics (
    id varchar PRIMARY KEY,
    goal_id varchar NOT NULL REFERENCES custom_learning_goals(id),
    topic_id varchar NOT NULL REFERENCES provider_subject_topics(id),
    target_score real NOT NULL DEFAULT 85
);

-- 8. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_skhe_student ON student_knowledge_hub_entries(student_account_id);
CREATE INDEX IF NOT EXISTS idx_skhe_workspace ON student_knowledge_hub_entries(workspace_id);
CREATE INDEX IF NOT EXISTS idx_skhe_subject ON student_knowledge_hub_entries(provider_subject_id);
CREATE INDEX IF NOT EXISTS idx_skhe_created ON student_knowledge_hub_entries(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_pkhe_provider ON provider_knowledge_hub_entries(provider_workspace_id);
CREATE INDEX IF NOT EXISTS idx_pkhe_topic ON provider_knowledge_hub_entries(topic_id);

CREATE INDEX IF NOT EXISTS idx_clg_student ON custom_learning_goals(student_account_id);
CREATE INDEX IF NOT EXISTS idx_clg_workspace ON custom_learning_goals(workspace_id);

CREATE INDEX IF NOT EXISTS idx_cgt_goal ON custom_goal_topics(goal_id);
CREATE INDEX IF NOT EXISTS idx_cgt_topic ON custom_goal_topics(topic_id);
