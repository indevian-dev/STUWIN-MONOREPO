import { db } from "@/lib/app-infrastructure/database";
import { workspaceRoles, workspaceToWorkspace } from "@/lib/app-infrastructure/database/schema";
import { eq } from "drizzle-orm";

async function main() {
    console.log("Checking super_staff role...");
    const roles = await db.select().from(workspaceRoles).where(eq(workspaceRoles.name, "super_staff"));
    console.log("Role:", JSON.stringify(roles, null, 2));

    console.log("Checking account with super_staff role...");
    const memberships = await db.select({
        accountId: workspaceToWorkspace.accountId,
        role: workspaceToWorkspace.role,
        toWorkspaceId: workspaceToWorkspace.toWorkspaceId
    }).from(workspaceToWorkspace).where(eq(workspaceToWorkspace.role, "super_staff"));
    console.log("Memberships:", JSON.stringify(memberships, null, 2));
}

main().catch(console.error);
