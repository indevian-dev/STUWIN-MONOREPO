import { BaseService } from "./BaseService";
import { AuthContext } from "@/lib/app-core-modules/types";
import { studentReports, workspaceAccesses } from "@/lib/app-infrastructure/database/schema";
import { db } from "@/lib/app-infrastructure/database";
import { eq, and, or, sql, isNotNull } from "drizzle-orm";

/**
 * ReportService - "Multi-Workspace" Optimized Reporting
 * Handles unified access to student reports across the Workspace Access Graph.
 */
export class ReportService extends BaseService {
    constructor(
        private readonly ctx: AuthContext,
        // In the new architecture, we might inject DB or other repos here
    ) {
        super();
    }

    /**
     * getReports
     * Fetches reports based on Viewer's Workspace context and Actor's Access.
     * 
     * Access Rules:
     * 1. Viewer is the Student (viewing self) -> viaWorkspaceId == targetWorkspaceId
     * 2. Viewer is connected (e.g. Parent/Staff) -> viaWorkspaceId != targetWorkspaceId
     * 
     * @param viewerKey - The workspace Access Key (Via Workspace ID) of the current user context
     * @param targetKey - (Optional) The specific student workspace to filter by
     */
    async getReports(viewerKey: string, targetKey?: string) {
        try {
            const targetFilter = targetKey ? sql`AND ${studentReports.workspaceId} = ${targetKey}` : sql``;
            const actorId = this.ctx.accountId;

            const result = await db.execute(sql`
                SELECT 
                    r.*, 
                    wa.access_role as "relationType"
                FROM ${studentReports} r
                INNER JOIN ${workspaceAccesses} wa 
                    ON wa.target_workspace_id = r.workspace_id 
                WHERE 
                    wa.via_workspace_id = ${viewerKey}
                    AND wa.actor_account_id = ${actorId}
                    ${targetFilter}
                ORDER BY r.generated_at DESC
                LIMIT 100
            `);

            return {
                success: true,
                data: result
            };


        } catch (error) {
            return this.handleError(error, "ReportService.getReports");
        }
    }

    /**
     * Drizzle Query Builder Version (Type-safe alternative)
     */
    async getReportsTypeSafe(viewerKey: string, targetKey?: string) {
        // Implementation using pure Drizzle ORM syntax if preferred
    }
}
