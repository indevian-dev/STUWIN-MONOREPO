
import { BaseService } from "../domain/BaseService";
import { AuthContext } from "@/lib/app-core-modules/types";
import { Database } from "@/lib/app-infrastructure/database";
import { auditLogs } from "@/lib/app-infrastructure/database/schema";

/**
 * AuditService - Handles global activity logging and data snapshotting
 */
export class AuditService extends BaseService {
    constructor(
        private readonly ctx: AuthContext,
        private readonly db: Database
    ) {
        super();
    }

    /**
     * Records a change in the system
     */
    async log(data: {
        entityType: string;
        entityId: string;
        action: 'create' | 'update' | 'delete' | 'login' | 'other';
        workspaceId?: string;
        before?: any;
        after?: any;
        extra?: any;
        ip?: string;
    }) {
        try {
            await this.db.insert(auditLogs).values({
                workspaceId: data.workspaceId || this.ctx.activeWorkspaceId,
                actorId: this.ctx.accountId,
                entityType: data.entityType,
                entityId: data.entityId,
                action: data.action,
                changeSummary: {
                    before: data.before,
                    after: data.after,
                    ip: data.ip,
                    extra: data.extra
                },
                createdAt: new Date()
            });
            return { success: true };
        } catch (error) {
            this.handleError(error, "AuditLog");
            return { success: false, error: "Failed to record audit log" };
        }
    }
}
