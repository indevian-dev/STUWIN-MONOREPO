
import { db } from "@/lib/app-infrastructure/database";
import { sql } from "drizzle-orm";

async function main() {
    console.log("🛠️ Fixing payment system database...");

    try {
        console.log("Creating payment_subscription table...");
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS "payment_subscription" (
                "id" varchar PRIMARY KEY NOT NULL,
                "created_at" timestamp with time zone DEFAULT now() NOT NULL,
                "type" varchar,
                "price" real,
                "subscribtion_period" varchar,
                "metadata" jsonb,
                "title" varchar,
                "is_active" boolean
            );
        `);
        console.log("✅ payment_subscription table created/verified.");
    } catch (e: any) {
        console.error("❌ Failed to create payment_subscription:", e.message);
    }

    try {
        console.log("Creating workspace_subscription_transactions table...");
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS "workspace_subscription_transactions" (
                "id" varchar PRIMARY KEY NOT NULL,
                "created_at" timestamp with time zone DEFAULT now() NOT NULL,
                "payment_channel" varchar,
                "paid_amount" real,
                "account_id" varchar REFERENCES "accounts"("id"),
                "workspace_id" varchar REFERENCES "workspaces"("id"),
                "metadata" jsonb,
                "status" varchar,
                "status_metadata" jsonb
            );
        `);
        console.log("✅ workspace_subscription_transactions table created/verified.");
    } catch (e: any) {
        console.error("❌ Failed to create workspace_subscription_transactions:", e.message);
    }

    try {
        console.log("Creating workspace_subscription_coupons table...");
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS "workspace_subscription_coupons" (
                "id" varchar PRIMARY KEY NOT NULL,
                "created_at" timestamp with time zone DEFAULT now() NOT NULL,
                "discount_percent" bigint,
                "code" varchar NOT NULL UNIQUE,
                "usage_count" bigint DEFAULT 0,
                "workspace_id" varchar REFERENCES "workspaces"("id"),
                "is_active" boolean DEFAULT true
            );
        `);
        console.log("✅ workspace_subscription_coupons table created/verified.");
    } catch (e: any) {
        console.error("❌ Failed to create workspace_subscription_coupons:", e.message);
    }

    try {
        console.log("Adding unique_enrollment_idx to workspace_accesses...");
        await db.execute(sql`
            CREATE UNIQUE INDEX IF NOT EXISTS "unique_enrollment_idx" 
            ON "workspace_accesses" ("actor_account_id", "target_workspace_id");
        `);
        console.log("✅ unique_enrollment_idx added/verified.");
    } catch (e: any) {
        console.error("❌ Failed to add unique_enrollment_idx:", e.message);
    }

    console.log("🏁 Done.");
    process.exit(0);
}

main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
});
