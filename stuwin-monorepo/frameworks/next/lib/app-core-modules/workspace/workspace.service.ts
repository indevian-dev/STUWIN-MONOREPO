
import { WorkspaceRepository } from "./workspace.repository";
import { BaseService } from "../domain/BaseService";
import { v4 as uuidv4 } from "uuid";
import { AuthContext } from "@/lib/app-core-modules/types";
import { Database } from "@/lib/app-infrastructure/database";

/**
 * WorkspaceService - Orchestrates workspace business logic
 */
export class WorkspaceService extends BaseService {
    constructor(
        public readonly repository: WorkspaceRepository,
        private readonly ctx: AuthContext,
        private readonly db: Database
    ) {
        super();
    }


    async createWorkspace(ownerAccountId: string, details: { title: string; type: string; metadata?: any }) {
        const allowedTypes = ['student', 'provider', 'staff', 'parent', 'tutor'];
        if (!allowedTypes.includes(details.type)) {
            return { success: false, error: `Invalid workspace type: ${details.type}` };
        }

        try {
            return await this.db.transaction(async (tx) => {
                const workspace = await this.repository.create({
                    title: details.title,
                    type: details.type,
                    metadata: details.metadata || {},
                    ownerAccountId: ownerAccountId,
                    isActive: true,
                }, tx as any);

                // No more "Roles" or "Memberships" tables. 
                // The "ownerAccountId" on the workspace table IS the permission.

                return { success: true, workspace };
            });
        } catch (error) {
            this.handleError(error, "createWorkspace");
            return { success: false, error: "Failed to create workspace" };
        }
    }

    /**
     * Connects two workspaces (e.g. Student enrolling in a School)
     */
    async connectWorkspaces(fromWorkspaceId: string, toWorkspaceId: string, relationType: string) {
        try {
            // Check if connection exists
            const existing = await this.repository.findConnection(fromWorkspaceId, toWorkspaceId);
            if (existing) {
                return { success: true, connection: existing, message: "Already connected" };
            }

            const connection = await this.repository.connectWorkspaces({
                fromWorkspaceId: fromWorkspaceId,
                toWorkspaceId: toWorkspaceId,
                relationType: relationType,
            });

            return { success: true, connection };

        } catch (error) {
            this.handleError(error, "connectWorkspaces");
            return { success: false, error: "Failed to connect workspaces" };
        }
    }

    async listProviders(options: any = {}) {
        try {
            const result = await this.repository.listProviders(options);
            return { success: true, data: result };
        } catch (error) {
            this.handleError(error, "listProviders");
            return { success: false, error: "Failed to list providers" };
        }
    }

    async listUserWorkspaces(accountId: string) {
        try {
            const workspaces = await this.repository.listUserWorkspaces(accountId);
            return { success: true, workspaces };
        } catch (error) {
            this.handleError(error, "listUserWorkspaces");
            return { success: false, error: "Failed to list user workspaces" };
        }
    }

    async getWorkspace(id: string) {
        try {
            const workspace = await this.repository.findById(id);
            return { success: true, workspace };
        } catch (error) {
            this.handleError(error, "getWorkspace");
            return { success: false, error: "Failed to get workspace" };
        }
    }

    /**
     * Parent Flow: Find child's student workspaces
     */
    async findChildWorkspaces(childFin: string) {
        try {
            const result = await this.repository.findStudentWorkspacesByChildFin(childFin);
            if (!result.length) {
                return { success: false, error: "No student found with this FIN" };
            }
            return { success: true, data: result };
        } catch (error) {
            this.handleError(error, "findChildWorkspaces");
            return { success: false, error: "Search failed" };
        }
    }

    /**
     * Parent Flow: Create Parent workspace and link to student workspaces
     */
    async startParentWorkspaceFlow(ownerAccountId: string, studentWorkspaceIds: string[]) {
        try {
            return await this.db.transaction(async (tx) => {
                // 1. Create Parent Workspace
                const parentWorkspace = await this.repository.create({
                    title: "Parent Dashboard",
                    type: "parent",
                    ownerAccountId: ownerAccountId,
                    isActive: true,
                }, tx as any);

                // 2. Connect to all selected student workspaces
                for (const studentWsId of studentWorkspaceIds) {
                    await this.repository.connectWorkspaces({
                        fromWorkspaceId: parentWorkspace.id,
                        toWorkspaceId: studentWsId,
                        relationType: "parent_monitor",
                    }, tx as any);
                }

                return { success: true, data: parentWorkspace };
            });
        } catch (error) {
            this.handleError(error, "startParentWorkspaceFlow");
            return { success: false, error: "Onboarding failed" };
        }
    }

    /**
     * Provider/Tutor Flow: Create organization/tutor workspace (Inactive until Staff approval)
     */
    async submitProviderApplication(ownerAccountId: string, details: { title: string; metadata: any }, type: string = "provider") {
        try {
            const workspace = await this.repository.create({
                title: details.title,
                type: type, // provider or tutor
                metadata: details.metadata,
                ownerAccountId: ownerAccountId,
                isActive: false, // Must be approved by Staff
            });

            return { success: true, data: workspace };
        } catch (error) {
            this.handleError(error, "submitProviderApplication");
            return { success: false, error: "Application failed" };
        }
    }
    /**
     * Student Flow: Create student workspace and enroll in a provider
     */
    async createStudentWorkspace(ownerAccountId: string, details: { displayName: string; gradeLevel: any; providerId: string }) {
        try {
            return await this.db.transaction(async (tx) => {
                // 1. Create Student Workspace
                const studentWorkspace = await this.repository.create({
                    title: details.displayName,
                    type: "student",
                    metadata: { gradeLevel: details.gradeLevel },
                    ownerAccountId: ownerAccountId,
                    isActive: true,
                }, tx as any);

                // 2. Link to Provider (Enrollment)
                await this.repository.connectWorkspaces({
                    fromWorkspaceId: studentWorkspace.id,
                    toWorkspaceId: details.providerId,
                    relationType: "enrollment",
                    role: "student",
                    isApproved: true, // Auto-approve for now, or false if provider needs to accept? Assuming active start.
                    accountId: ownerAccountId, // The account creating the link
                }, tx as any);

                return { success: true, data: studentWorkspace };
            });
        } catch (error) {
            this.handleError(error, "createStudentWorkspace");
            return { success: false, error: "Failed to create student workspace" };
        }
    }
}
