CREATE TABLE "user_sessions" (
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"group_id" varchar,
	"device" varchar,
	"browser" varchar,
	"os" varchar,
	"metada" json,
	"ip" varchar,
	"expire_at" timestamp with time zone,
	"account_id" varchar
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "sessions_group_id" varchar;--> statement-breakpoint
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_sessions_group_id_unique" UNIQUE("sessions_group_id");