ALTER TABLE "workspaces" DROP CONSTRAINT "workspaces_workspace_access_key_unique";--> statement-breakpoint
ALTER TABLE "account_bookmarks" ADD COLUMN "workspace_id" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "account_notifications" ADD COLUMN "workspace_id" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "learning_subject_pdfs" ADD COLUMN "workspace_id" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "learning_subject_topics" ADD COLUMN "workspace_id" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "learning_subjects" ADD COLUMN "workspace_id" varchar;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "workspace_id" varchar;--> statement-breakpoint
ALTER TABLE "student_homeworks" ADD COLUMN "workspace_id" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "student_learning_sessions" ADD COLUMN "workspace_id" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "student_quizzes" ADD COLUMN "workspace_id" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "student_reports" ADD COLUMN "workspace_id" varchar;--> statement-breakpoint
ALTER TABLE "account_bookmarks" ADD CONSTRAINT "account_bookmarks_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_notifications" ADD CONSTRAINT "account_notifications_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_subject_pdfs" ADD CONSTRAINT "learning_subject_pdfs_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_subject_topics" ADD CONSTRAINT "learning_subject_topics_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_subjects" ADD CONSTRAINT "learning_subjects_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_homeworks" ADD CONSTRAINT "student_homeworks_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_learning_sessions" ADD CONSTRAINT "student_learning_sessions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_quizzes" ADD CONSTRAINT "student_quizzes_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_reports" ADD CONSTRAINT "student_reports_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_bookmarks" DROP COLUMN "workspace_access_key";--> statement-breakpoint
ALTER TABLE "account_notifications" DROP COLUMN "workspace_access_key";--> statement-breakpoint
ALTER TABLE "learning_subject_pdfs" DROP COLUMN "workspace_access_key";--> statement-breakpoint
ALTER TABLE "learning_subject_topics" DROP COLUMN "workspace_access_key";--> statement-breakpoint
ALTER TABLE "learning_subjects" DROP COLUMN "workspace_access_key";--> statement-breakpoint
ALTER TABLE "questions" DROP COLUMN "workspace_access_key";--> statement-breakpoint
ALTER TABLE "student_homeworks" DROP COLUMN "workspace_access_key";--> statement-breakpoint
ALTER TABLE "student_learning_sessions" DROP COLUMN "workspace_access_key";--> statement-breakpoint
ALTER TABLE "student_quizzes" DROP COLUMN "workspace_access_key";--> statement-breakpoint
ALTER TABLE "student_reports" DROP COLUMN "workspace_access_key";--> statement-breakpoint
ALTER TABLE "workspaces" DROP COLUMN "workspace_access_key";