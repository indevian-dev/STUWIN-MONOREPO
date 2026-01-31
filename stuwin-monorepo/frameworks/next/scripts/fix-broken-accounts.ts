
import { db } from "@/lib/app-infrastructure/database";
import { accounts, workspaces } from "@/lib/app-infrastructure/database/schema";
import { eq, notInArray } from "drizzle-orm";
import { generateSlimId } from "@/lib/utils/slimUlidUtility";

async function main() {
    console.log("🔍 Checking for orphaned accounts...");

    // Get all accounts
    const allAccounts = await db.select().from(accounts);
    console.log(`Found ${allAccounts.length} total accounts.`);

    if (allAccounts.length === 0) {
        console.log("No accounts found. Exiting.");
        process.exit(0);
    }

    // Get all workspaces to find owners
    const allWorkspaces = await db.select().from(workspaces);
    const workspaceOwnerIds = new Set(allWorkspaces.map(w => w.ownerAccountId).filter(Boolean));

    // Find accounts that don't own a workspace
    const orphanedAccounts = allAccounts.filter(acc => !workspaceOwnerIds.has(acc.id));

    console.log(`Found ${orphanedAccounts.length} orphaned accounts (no workspace owned).`);

    if (orphanedAccounts.length === 0) {
        console.log("All accounts have workspaces. Exiting.");
        process.exit(0);
    }

    console.log("🛠️ Fixing orphaned accounts...");

    let fixedCount = 0;

    for (const account of orphanedAccounts) {
        try {
            console.log(`Creating workspace for account ${account.id} (User: ${account.userId})...`);

            await db.insert(workspaces).values({
                id: generateSlimId(),
                type: 'personal',
                title: 'Personal Workspace',
                ownerAccountId: account.id,
                isActive: true
            });

            fixedCount++;
        } catch (error: any) {
            console.error(`Failed to fix account ${account.id}:`, error.message);
        }
    }

    console.log(`✅ Successfully fixed ${fixedCount} accounts.`);
    process.exit(0);
}

main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
});
