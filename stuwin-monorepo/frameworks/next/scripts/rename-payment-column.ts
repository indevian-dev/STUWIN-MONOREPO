
import { db } from "@/lib/app-infrastructure/database";
import { sql } from "drizzle-orm";

async function main() {
    console.log("🛠️ Renaming payment_subscription.subscribtion_period to subscription_period...");

    try {
        await db.execute(sql`ALTER TABLE "payment_subscription" RENAME COLUMN "subscribtion_period" TO "subscription_period";`);
        console.log("✅ Column renamed successfully.");
    } catch (e: any) {
        if (e.message.includes('does not exist')) {
            console.log("ℹ️ column \"subscribtion_period\" does not exist, maybe already renamed?");
        } else {
            console.error("❌ Failed to rename column:", e.message);
        }
    }

    console.log("🏁 Done.");
    process.exit(0);
}

main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
});
