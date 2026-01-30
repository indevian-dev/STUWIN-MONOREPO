import { BaseService } from "./BaseService";
import { AuthContext } from "@/lib/app-core-modules/types";
import { studentReports, workspaceToWorkspace } from "@/lib/app-infrastructure/database/schema";
import { db } from "@/lib/app-infrastructure/database";
import { eq, and, or, sql, isNotNull } from "drizzle-orm";

/**
 * ReportService - "Multi-Workspace" Optimized Reporting
 * Handles unified access to student reports across the W2W Graph.
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
     * Fetches reports based on Viewer's Workspace context.
     * 
     * Access Rules:
     * 1. Viewer is the Student (viewing self)
     * 2. Viewer is connected via W2W (relation_type check potentially needed)
     * 
     * @param viewerKey - The workspace Access Key of the current user context
     * @param targetKey - (Optional) The specific student workspace to filter by
     */
    async getReports(viewerKey: string, targetKey?: string) {
        try {
            // Using SQL template for maximal performance and matching the Master Prompt logic exactly
            // The prompt asked for:
            // SELECT r.*, w2w.relation_type 
            // FROM student_reports r
            // LEFT JOIN workspace_to_workspace w2w ...

            const targetFilter = targetKey ? sql`AND ${studentReports.workspaceId} = ${targetKey}` : sql``;

            const result = await db.execute(sql`
                SELECT 
                    r.*, 
                    w2w.relation_type as "relationType"
                FROM ${studentReports} r
                LEFT JOIN ${workspaceToWorkspace} w2w 
                    ON w2w.to_workspace_id = r.workspace_id 
                    AND w2w.from_workspace_id = ${viewerKey}
                WHERE 
                    (
                        r.workspace_id = ${viewerKey} -- Self view
                        OR w2w.from_workspace_id IS NOT NULL -- Connected view
                    )
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
