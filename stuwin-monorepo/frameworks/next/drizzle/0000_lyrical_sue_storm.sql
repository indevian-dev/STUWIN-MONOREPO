CREATE TABLE "account_bookmarks" (
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"question_id" varchar,
	"account_id" varchar,
	"workspace_access_key" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account_notifications" (
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" varchar,
	"body" varchar,
	"mark_as_read" boolean,
	"account_id" varchar,
	"updated_at" timestamp with time zone,
	"workspace_access_key" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account_otps" (
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"code" varchar,
	"expire_at" timestamp with time zone,
	"type" varchar,
	"account_id" varchar
);
--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now(),
	"user_id" varchar,
	"suspended" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "blogs" (
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"title_az" text,
	"meta_title_az" text,
	"meta_description_az" text,
	"content_az" text,
	"slug" varchar,
	"is_active" boolean,
	"cover" text,
	"updated_at" timestamp with time zone,
	"is_featured" boolean,
	"title_en" text,
	"meta_description_en" text,
	"content_en" text,
	"created_by" varchar,
	"meta_title_en" text
);
--> statement-breakpoint
CREATE TABLE "cities" (
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"title" varchar,
	"country_id" varchar
);
--> statement-breakpoint
CREATE TABLE "countries" (
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" varchar NOT NULL,
	"iso_code" varchar,
	"phone_code" varchar,
	"currency" varchar DEFAULT 'AZN',
	CONSTRAINT "countries_name_unique" UNIQUE("name"),
	CONSTRAINT "countries_iso_code_unique" UNIQUE("iso_code")
);
--> statement-breakpoint
CREATE TABLE "learning_subject_pdfs" (
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"pdf_url" text,
	"pdf_order" text,
	"learning_subject_id" varchar,
	"is_active" boolean,
	"upload_account_id" varchar,
	"topics_ordered_ids" json,
	"workspace_access_key" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learning_subject_topics" (
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"body" text,
	"grade_level" bigint,
	"name" text,
	"learning_subject_id" varchar,
	"ai_summary" text,
	"topic_published_questions_stats" bigint DEFAULT 0,
	"topic_general_questions_stats" bigint DEFAULT 0,
	"is_active_for_ai" boolean DEFAULT false,
	"topic_estimated_questions_capacity" bigint,
	"topic_questions_remaining_to_generate" bigint,
	"pdf_s3_key" text,
	"pdf_page_start" bigint,
	"pdf_page_end" bigint,
	"total_pdf_pages" bigint,
	"chapter_number" text,
	"parent_topic_id" varchar,
	"estimated_education_start_date" time,
	"subject_pdf_id" varchar,
	"workspace_access_key" varchar NOT NULL,
	"fts_tokens" text,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "learning_subjects" (
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"title" text,
	"description" text,
	"cover" text,
	"slug" text,
	"is_active" boolean,
	"ai_label" text,
	"workspace_access_key" varchar
);
--> statement-breakpoint
CREATE TABLE "pages" (
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"type" varchar,
	"content_az" text,
	"update_at" timestamp,
	"meta_title" text,
	"content_ru" text,
	"content_en" text,
	CONSTRAINT "pages_type_unique" UNIQUE("type")
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"question" text,
	"answers" json,
	"correct_answer" text,
	"author_account_id" varchar,
	"reviewer_account_id" varchar,
	"learning_subject_id" varchar,
	"complexity" text,
	"grade_level" bigint,
	"explanation_guide" json,
	"updated_at" timestamp with time zone,
	"language" text,
	"workspace_access_key" varchar,
	"learning_subject_topic_id" varchar,
	"is_published" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "student_homeworks" (
	"id" varchar PRIMARY KEY NOT NULL,
	"workspace_access_key" varchar NOT NULL,
	"student_account_id" varchar NOT NULL,
	"title" varchar NOT NULL,
	"description" text,
	"subject" varchar,
	"topic_id" varchar,
	"quiz_id" varchar,
	"image_url" varchar,
	"image_storage_path" varchar,
	"original_file_name" varchar,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"learning_conversation_id" varchar,
	"due_date" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "student_learning_sessions" (
	"id" varchar PRIMARY KEY NOT NULL,
	"workspace_access_key" varchar NOT NULL,
	"student_account_id" varchar NOT NULL,
	"quiz_id" varchar,
	"topic_id" varchar,
	"homework_id" varchar,
	"root_question" text NOT NULL,
	"messages" jsonb DEFAULT '{"nodes":[]}'::jsonb NOT NULL,
	"status" varchar DEFAULT 'active' NOT NULL,
	"branch_count" integer DEFAULT 0 NOT NULL,
	"message_count" integer DEFAULT 0 NOT NULL,
	"total_tokens_used" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_quizzes" (
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"student_account_id" varchar,
	"score" real,
	"questions" json,
	"result" json,
	"learning_subject_id" varchar,
	"grade_level" bigint,
	"language" text,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"complexity" text,
	"total_questions" bigint,
	"correct_answers" bigint,
	"status" text,
	"user_answers" json,
	"workspace_access_key" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_reports" (
	"id" varchar PRIMARY KEY NOT NULL,
	"student_account_id" varchar NOT NULL,
	"report_data" jsonb NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"week_start" timestamp with time zone NOT NULL,
	"week_end" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"workspace_access_key" varchar
);
--> statement-breakpoint
CREATE TABLE "system_prompts" (
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"body" text,
	"title" text
);
--> statement-breakpoint
CREATE TABLE "user_credentials" (
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"password" text,
	"facebook_id" varchar,
	"google_id" varchar,
	"apple_id" varchar,
	"user_id" varchar,
	CONSTRAINT "user_credentials_facebook_id_unique" UNIQUE("facebook_id"),
	CONSTRAINT "user_credentials_google_id_unique" UNIQUE("google_id"),
	CONSTRAINT "user_credentials_apple_id_unique" UNIQUE("apple_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"phone" varchar,
	"email_is_verified" boolean DEFAULT false,
	"phone_is_verified" boolean DEFAULT false,
	"avatar_url" text,
	"first_name" text,
	"last_name" text,
	"avatar_base64" varchar,
	"sessions" json,
	"two_factor_auth_email_expire_at" time,
	"two_factor_auth_phone_expire_at" time,
	"fin" varchar,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_fin_unique" UNIQUE("fin")
);
--> statement-breakpoint
CREATE TABLE "workspace_roles" (
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" varchar NOT NULL,
	"slug" varchar NOT NULL,
	"permissions" jsonb DEFAULT '{}'::jsonb,
	"is_staff" boolean DEFAULT false,
	"for_workspace_type" varchar,
	CONSTRAINT "workspace_roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "workspace_to_workspace" (
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"relation_type" varchar,
	"account_id" varchar,
	"from_workspace_id" varchar,
	"to_workspace_id" varchar,
	"is_approved" boolean,
	"role" varchar
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" varchar PRIMARY KEY NOT NULL,
	"workspace_access_key" varchar NOT NULL,
	"type" varchar NOT NULL,
	"title" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"owner_account_id" varchar,
	"city_id" varchar,
	"parent_workspace_id" varchar,
	"is_active" boolean DEFAULT true,
	"is_blocked" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "workspaces_workspace_access_key_unique" UNIQUE("workspace_access_key")
);
--> statement-breakpoint
ALTER TABLE "account_bookmarks" ADD CONSTRAINT "account_bookmarks_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_bookmarks" ADD CONSTRAINT "account_bookmarks_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_notifications" ADD CONSTRAINT "account_notifications_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cities" ADD CONSTRAINT "cities_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_subject_pdfs" ADD CONSTRAINT "learning_subject_pdfs_learning_subject_id_learning_subjects_id_fk" FOREIGN KEY ("learning_subject_id") REFERENCES "public"."learning_subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_subject_topics" ADD CONSTRAINT "learning_subject_topics_learning_subject_id_learning_subjects_id_fk" FOREIGN KEY ("learning_subject_id") REFERENCES "public"."learning_subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_subject_topics" ADD CONSTRAINT "learning_subject_topics_subject_pdf_id_learning_subject_pdfs_id_fk" FOREIGN KEY ("subject_pdf_id") REFERENCES "public"."learning_subject_pdfs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_subject_topics" ADD CONSTRAINT "topics_parent_topic_id_fkey" FOREIGN KEY ("parent_topic_id") REFERENCES "public"."learning_subject_topics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_author_account_id_accounts_id_fk" FOREIGN KEY ("author_account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_reviewer_account_id_accounts_id_fk" FOREIGN KEY ("reviewer_account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_learning_subject_id_learning_subjects_id_fk" FOREIGN KEY ("learning_subject_id") REFERENCES "public"."learning_subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_learning_subject_topic_id_learning_subject_topics_id_fk" FOREIGN KEY ("learning_subject_topic_id") REFERENCES "public"."learning_subject_topics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_homeworks" ADD CONSTRAINT "student_homeworks_student_account_id_accounts_id_fk" FOREIGN KEY ("student_account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_homeworks" ADD CONSTRAINT "student_homeworks_topic_id_learning_subject_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."learning_subject_topics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_homeworks" ADD CONSTRAINT "student_homeworks_learning_conversation_id_student_learning_sessions_id_fk" FOREIGN KEY ("learning_conversation_id") REFERENCES "public"."student_learning_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_learning_sessions" ADD CONSTRAINT "student_learning_sessions_student_account_id_accounts_id_fk" FOREIGN KEY ("student_account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_learning_sessions" ADD CONSTRAINT "student_learning_sessions_topic_id_learning_subject_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."learning_subject_topics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_quizzes" ADD CONSTRAINT "student_quizzes_student_account_id_accounts_id_fk" FOREIGN KEY ("student_account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_quizzes" ADD CONSTRAINT "student_quizzes_learning_subject_id_learning_subjects_id_fk" FOREIGN KEY ("learning_subject_id") REFERENCES "public"."learning_subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_reports" ADD CONSTRAINT "student_reports_student_account_id_accounts_id_fk" FOREIGN KEY ("student_account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_credentials" ADD CONSTRAINT "user_credentials_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_to_workspace" ADD CONSTRAINT "workspace_to_workspace_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_to_workspace" ADD CONSTRAINT "workspace_to_workspace_from_workspace_id_workspaces_id_fk" FOREIGN KEY ("from_workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_to_workspace" ADD CONSTRAINT "workspace_to_workspace_to_workspace_id_workspaces_id_fk" FOREIGN KEY ("to_workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_owner_account_id_accounts_id_fk" FOREIGN KEY ("owner_account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_parent_workspace_id_fkey" FOREIGN KEY ("parent_workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;