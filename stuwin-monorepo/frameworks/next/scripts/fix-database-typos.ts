
import { db } from "@/lib/app-infrastructure/database";
import { sql } from "drizzle-orm";

async function main() {
    console.log("🛠️ Fixing database typos...");

    try {
        console.log("Renaming user_sessions.metada to metadata...");
        await db.execute(sql`ALTER TABLE "user_sessions" RENAME COLUMN "metada" TO "metadata";`);
        console.log("✅ user_sessions.metadata fixed.");
    } catch (e: any) {
        if (e.message.includes('already exists')) {
            console.log("ℹ️ column \"metadata\" already exists in \"user_sessions\".");
        } else if (e.message.includes('does not exist')) {
            console.log("ℹ️ column \"metada\" does not exist in \"user_sessions\".");
        } else {
            console.error("❌ Failed to rename user_sessions.metada:", e.message);
        }
    }

    try {
        console.log("Renaming accounts.subscribed_untill to subscribed_until...");
        await db.execute(sql`ALTER TABLE "accounts" RENAME COLUMN "subscribed_untill" TO "subscribed_until";`);
        console.log("✅ accounts.subscribed_until fixed.");
    } catch (e: any) {
        if (e.message.includes('already exists')) {
            console.log("ℹ️ column \"subscribed_until\" already exists in \"accounts\".");
        } else if (e.message.includes('does not exist')) {
            console.log("ℹ️ column \"subscribed_untill\" does not exist in \"accounts\".");
        } else {
            console.error("❌ Failed to rename accounts.subscribed_untill:", e.message);
        }
    }

    console.log("🏁 Done.");
    process.exit(0);
}

main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
});
