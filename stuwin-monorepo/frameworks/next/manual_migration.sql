-- Migration script for Scoped Subscriptions
-- Run these commands manually in your database console / drizzle studio.

-- 1. Create active_subscriptions table
CREATE TABLE IF NOT EXISTS "active_subscriptions" (
	"id" varchar PRIMARY KEY NOT NULL,
	"account_id" varchar REFERENCES "accounts"("id"),
	"scope" varchar NOT NULL,
	"scope_id" varchar NOT NULL,
	"plan_type" varchar NOT NULL,
	"plan_id" varchar,
	"starts_at" timestamp with time zone DEFAULT now(),
	"ends_at" timestamp with time zone,
	"status" varchar DEFAULT 'active',
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"payment_transaction_id" varchar
);

-- 2. Create payment_subscription table (if missing)
CREATE TABLE IF NOT EXISTS "payment_subscription" (
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"type" varchar,
	"price" real,
	"subscribtion_period" varchar,
	"metadata" json,
	"title" varchar,
	"is_active" boolean
);

-- 3. Create student_quiz_reports table (if missing)
CREATE TABLE IF NOT EXISTS "student_quiz_reports" (
	"id" varchar PRIMARY KEY NOT NULL,
	"quiz_id" varchar NOT NULL REFERENCES "student_quizzes"("id"),
	"student_account_id" varchar NOT NULL REFERENCES "accounts"("id"),
	"workspace_id" varchar NOT NULL REFERENCES "workspaces"("id"),
	"report_text" text,
	"learning_insights" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- 4. Sync student_homeworks columns
-- Note: Check if these columns already exist before running.
ALTER TABLE "student_homeworks" ADD COLUMN IF NOT EXISTS "text_content" text;
ALTER TABLE "student_homeworks" ADD COLUMN IF NOT EXISTS "media" jsonb DEFAULT '[]'::jsonb;
-- Ensure original_file_name exists
ALTER TABLE "student_homeworks" ADD COLUMN IF NOT EXISTS "original_file_name" varchar;

-- 5. Sync user_sessions column (Optional / Risky)
-- Only run if you want to align schema with DB column name `meta_data`
-- If your DB has `metadata`, rename it:
-- ALTER TABLE "user_sessions" RENAME COLUMN "metadata" TO "meta_data";
