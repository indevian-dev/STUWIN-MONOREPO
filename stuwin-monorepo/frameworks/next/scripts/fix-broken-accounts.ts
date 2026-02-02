
import { db } from "@/lib/app-infrastructure/database";
import { accounts, workspaces, workspaceAccesses } from "@/lib/app-infrastructure/database/schema";
import { eq, notInArray, and } from "drizzle-orm";
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

    // Get all accesses to find owners (Role: manager, via == target)
    const ownerAccesses = await db.select().from(workspaceAccesses).where(
        and(
            eq(workspaceAccesses.viaWorkspaceId, workspaceAccesses.targetWorkspaceId),
            eq(workspaceAccesses.accessRole, 'manager')
        )
    );
    const workspaceOwnerIds = new Set(ownerAccesses.map(a => a.actorAccountId).filter(Boolean));

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

            const wsId = generateSlimId();
            await db.insert(workspaces).values({
                id: wsId,
                type: 'student', // Changed from personal to student as per modern naming
                title: 'Personal Workspace',
                isActive: true
            });

            await db.insert(workspaceAccesses).values({
                id: generateSlimId(),
                actorAccountId: account.id,
                targetWorkspaceId: wsId,
                viaWorkspaceId: wsId,
                accessRole: 'manager'
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
