
import { WorkspaceRepository } from "./workspace.repository";
import { type ProviderListOptions, type CreateWorkspaceDetails, type ProviderApplicationDetails, type CreateStudentWorkspaceDetails, type WorkspaceProfile } from "./workspace.types";
import { BaseService } from "../base/base.service";
import { AuthContext } from "@/lib/domain/base/types";
import { Database } from "@/lib/database";
import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

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


    async createWorkspace(ownerAccountId: string, details: CreateWorkspaceDetails) {
        const allowedTypes = ['student', 'provider', 'staff', 'parent'];
        if (!allowedTypes.includes(details.type)) {
            return { success: false, error: `Invalid workspace type: ${details.type}` };
        }

        try {
            return await this.db.transaction(async (tx) => {
                const workspace = await this.repository.create({
                    title: details.title,
                    type: details.type,
                    profile: (details.metadata || {}) as any,
                    isActive: true,
                }, tx);

                // Add Owner Access (Direct)
                // Role: 'manager' is typically the owner role for Provider/Staff.
                // For Student/Parent, it might be 'owner' or specific. Using 'manager' as generic owner role for now.
                // Ensure 'manager' role exists in seed data.
                await this.repository.addAccess({
                    actorAccountId: ownerAccountId,
                    targetWorkspaceId: workspace.id,
                    viaWorkspaceId: workspace.id,
                    accessRole: 'manager',
                }, tx);

                return { success: true, workspace };
            });
        } catch (error) {
            this.handleError(error, "createWorkspace");
            return { success: false, error: "Failed to create workspace" };
        }
    }

    /**
     * Lists Providers (Schools/Courses)
     */
    async listProviders(options: ProviderListOptions = {}) {
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

    async listEnrolledProviders(accountId: string) {
        try {
            const data = await this.repository.findEnrolledAccesses(accountId);
            return { success: true, data };
        } catch (error) {
            this.handleError(error, "listEnrolledProviders");
            return { success: false, error: "Failed to list enrolled providers" };
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
                    isActive: true,
                }, tx);

                // 2. Add Parent Owner Access
                await this.repository.addAccess({
                    actorAccountId: ownerAccountId,
                    targetWorkspaceId: parentWorkspace.id,
                    viaWorkspaceId: parentWorkspace.id,
                    accessRole: 'manager', // Owner of Parent Workspace
                }, tx);

                // 3. Connect to all selected student workspaces
                // Parent accesses Student Workspace VIA Parent Workspace
                for (const studentWsId of studentWorkspaceIds) {
                    await this.repository.addAccess({
                        actorAccountId: ownerAccountId, // Parent User
                        targetWorkspaceId: studentWsId, // Student Workspace
                        viaWorkspaceId: parentWorkspace.id, // Via Parent Dashboard
                        accessRole: 'parent_monitor', // Role in Student Workspace
                    }, tx);
                }

                return { success: true, data: parentWorkspace };
            });
        } catch (error) {
            this.handleError(error, "startParentWorkspaceFlow");
            return { success: false, error: "Onboarding failed" };
        }
    }

    /**
     * Provider Flow: Create organization workspace (Inactive until Staff approval)
     */
    async submitProviderApplication(ownerAccountId: string, details: ProviderApplicationDetails, type: string = "provider") {
        try {
            return await this.db.transaction(async (tx) => {
                const workspace = await this.repository.create({
                    title: details.title,
                    type: type,
                    profile: details.metadata || {}, // Mapping legacy metadata to profile
                    isActive: false, // Must be approved by Staff
                }, tx);

                // Add Owner Access (but workspace is inactive)
                await this.repository.addAccess({
                    actorAccountId: ownerAccountId,
                    targetWorkspaceId: workspace.id,
                    viaWorkspaceId: workspace.id,
                    accessRole: 'manager',
                }, tx);

                return { success: true, data: workspace };
            });
        } catch (error) {
            this.handleError(error, "submitProviderApplication");
            return { success: false, error: "Application failed" };
        }
    }

    /**
     * Student Flow: Create student workspace and enroll in a provider
     */
    async createStudentWorkspace(ownerAccountId: string, details: CreateStudentWorkspaceDetails) {
        try {
            return await this.db.transaction(async (tx) => {
                // 0. Check if already enrolled to prevent double-workspace creation
                const existing = await this.repository.findAccess(ownerAccountId, details.providerId, undefined, tx);
                if (existing) {
                    return { success: false, error: "Already enrolled in this provider", code: "ALREADY_ENROLLED" };
                }

                // 1. Fetch Provider to get trial days from its profile
                const provider = await this.repository.findById(details.providerId, tx);
                const profile = provider?.profile as WorkspaceProfile;
                const trialDays = profile?.providerTrialDaysCount || 0;

                const subscribedUntil = new Date();
                subscribedUntil.setDate(subscribedUntil.getDate() + trialDays);

                // 2. Create Student Workspace
                const studentWorkspace = await this.repository.create({
                    title: details.displayName,
                    type: "student",
                    profile: {
                        type: 'student',
                        gradeLevel: details.gradeLevel
                    },
                    isActive: true,
                }, tx);

                // 3. Add Student Owner Access (Direct)
                await this.repository.addAccess({
                    actorAccountId: ownerAccountId,
                    targetWorkspaceId: studentWorkspace.id,
                    viaWorkspaceId: studentWorkspace.id,
                    accessRole: 'student', // Student is 'student' role in their own workspace? Or 'manager'? 
                    // Usually 'student' role implies learning features.
                }, tx);

                // 4. Connect to the selected Provider (School/Center)
                // Student IS ENROLLED IN Provider
                // Actor: Student, Target: Provider, Via: StudentWorkspace
                await this.repository.addAccess({
                    actorAccountId: ownerAccountId,
                    targetWorkspaceId: details.providerId,
                    viaWorkspaceId: studentWorkspace.id,
                    accessRole: 'student', // Role in Provider is 'student'
                    subscribedUntil: subscribedUntil, // Subscription is ON the access to Provider
                }, tx);

                return { success: true, data: studentWorkspace };
            });
        } catch (error) {
            this.handleError(error, "createStudentWorkspace");
            return { success: false, error: "Student onboarding failed" };
        }
    }

    // ... (S3 Media methods kept as is)
    /**
     * Generate S3 Pre-signed URL for User Media
     */
    async getUserMediaUploadUrl(userId: string, fileName: string, fileType: string) {
        try {
            const accessKeyId = process.env.AWS_S3_ACCESS_KEY_ID;
            const secretAccessKey = process.env.AWS_S3_SECRET_ACCESS_KEY;

            if (!accessKeyId || !secretAccessKey) {
                return { success: false, error: "S3 credentials not configured", code: 500 };
            }

            const s3Client = new S3Client({
                region: process.env.AWS_REGION || 'global',
                endpoint: process.env.AWS_S3_ENDPOINT,
                credentials: {
                    accessKeyId,
                    secretAccessKey,
                },
            });

            const extension = fileType.split('/')[1] || 'bin';
            const s3Params = {
                Bucket: process.env.AWS_S3_BUCKET_NAME,
                Key: `products/${userId}/${fileName}.${extension}`,
                ContentType: fileType,
            };

            const command = new PutObjectCommand(s3Params);
            const uploadURL = await getSignedUrl(s3Client, command, { expiresIn: 600 });

            return { success: true, data: { uploadURL, fileName } };
        } catch (error) {
            this.handleError(error, "getUserMediaUploadUrl");
            return { success: false, error: "Failed to generate upload URL" };
        }
    }

    /**
     * Delete User Media from S3
     */
    async deleteUserMedia(fileName: string, filePath: string) {
        try {
            const accessKeyId = process.env.AWS_S3_ACCESS_KEY_ID;
            const secretAccessKey = process.env.AWS_S3_SECRET_ACCESS_KEY;

            if (!accessKeyId || !secretAccessKey) {
                return { success: false, error: "S3 credentials not configured", code: 500 };
            }

            const s3Client = new S3Client({
                region: process.env.AWS_REGION || 'global',
                endpoint: process.env.AWS_S3_ENDPOINT,
                credentials: {
                    accessKeyId,
                    secretAccessKey,
                },
            });

            const params = {
                Bucket: process.env.AWS_S3_BUCKET_NAME,
                Key: `${filePath}/${fileName}`,
            };

            // 1. Delete the object
            const deleteCommand = new DeleteObjectCommand(params);
            await s3Client.send(deleteCommand);

            // 2. Verify deletion
            try {
                const headCommand = new HeadObjectCommand(params);
                await s3Client.send(headCommand);
                return { success: false, error: "File could not be deleted", code: 500 };
            } catch (headErr: unknown) {
                if (headErr && typeof headErr === 'object' && 'name' in headErr && (headErr as any).name === "NotFound") {
                    return { success: true, message: "File deleted successfully" };
                }
                throw headErr;
            }
        } catch (error) {
            this.handleError(error, "deleteUserMedia");
            return { success: false, error: "Failed to delete file" };
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // STAFF & PROVIDER MANAGEMENT
    // ═══════════════════════════════════════════════════════════════

    /**
     * Lists all workspaces for an account with detailed info (type, role, status)
     * Used by staff to view a user's workspace memberships
     */
    async listWorkspacesForAccount(accountId: string) {
        try {
            const workspaces = await this.repository.listUserWorkspaces(accountId);
            return { success: true, data: { workspaces } };
        } catch (error) {
            this.handleError(error, "listWorkspacesForAccount");
            return { success: false, error: "Failed to list user workspaces" };
        }
    }

    /**
     * Adds a user to a staff workspace with a specific role.
     * Protected by 2FA at the route level.
     */
    async addUserToStaffWorkspace(params: {
        accountId: string;
        targetWorkspaceId: string;
        accessRole: string;
    }) {
        try {
            // 1. Verify target workspace exists and is a staff workspace
            const workspace = await this.repository.findById(params.targetWorkspaceId);
            if (!workspace) {
                return { success: false, error: "Workspace not found" };
            }
            if (workspace.type !== 'staff') {
                return { success: false, error: "Target workspace is not a staff workspace" };
            }

            // 2. Check for existing access
            const existing = await this.repository.findAccess(
                params.accountId,
                params.targetWorkspaceId
            );
            if (existing) {
                return { success: false, error: "User already has access to this workspace" };
            }

            // 3. Create access record
            const access = await this.repository.addAccess({
                actorAccountId: params.accountId,
                targetWorkspaceId: params.targetWorkspaceId,
                viaWorkspaceId: params.targetWorkspaceId, // Direct access
                accessRole: params.accessRole,
            });

            return { success: true, data: { access } };
        } catch (error) {
            this.handleError(error, "addUserToStaffWorkspace");
            return { success: false, error: "Failed to add user to staff workspace" };
        }
    }

    /**
     * Lists all members (staff) of a provider workspace with user profile data
     */
    async listProviderMembers(providerWorkspaceId: string, page: number = 1, limit: number = 20) {
        try {
            const offset = (page - 1) * limit;
            const result = await this.repository.listDirectMembers(providerWorkspaceId, { limit, offset });
            return {
                success: true,
                data: {
                    members: result.members,
                    total: result.total,
                    totalPages: result.totalPages,
                    page,
                }
            };
        } catch (error) {
            this.handleError(error, "listProviderMembers");
            return { success: false, error: "Failed to list provider members" };
        }
    }
    // ═══════════════════════════════════════════════════════════════
    // INVITATIONS
    // ═══════════════════════════════════════════════════════════════

    async inviteMember(workspaceId: string, invitedByAccountId: string, email: string, role: string) {
        try {
            // 1. Find account by email
            const invitedConfig = await this.repository.findAccountByEmail(email);
            if (!invitedConfig) {
                return { success: false, error: "User with this email not found" };
            }

            // 2. Check if already member
            const existingMember = await this.repository.findAccess(invitedConfig.id, workspaceId, workspaceId);
            if (existingMember) {
                return { success: false, error: "User is already a member of this workspace" };
            }

            // 3. Create Invitation
            const invitation = await this.repository.createInvitation({
                forWorkspaceId: workspaceId,
                invitedAccountId: invitedConfig.id,
                invitedByAccountId: invitedByAccountId,
                accessRole: role,
                expireAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
            });

            return { success: true, data: invitation };
        } catch (error) {
            this.handleError(error, "inviteMember");
            return { success: false, error: "Failed to invite member" };
        }
    }

    async getMyInvitations(accountId: string) {
        try {
            const invitations = await this.repository.listInvitationsForAccount(accountId);
            return { success: true, data: invitations };
        } catch (error) {
            this.handleError(error, "getMyInvitations");
            return { success: false, error: "Failed to list invitations" };
        }
    }

    async respondToInvitation(invitationId: string, accountId: string, action: 'approve' | 'decline') {
        try {
            return await this.db.transaction(async (tx) => {
                // 1. Get Invitation
                const invitation = await this.repository.findInvitation(invitationId, tx);
                if (!invitation) return { success: false, error: "Invitation not found" };

                // 2. Validate Owner
                if (invitation.invitedAccountId !== accountId) {
                    return { success: false, error: "Not your invitation" };
                }

                if (invitation.isApproved || invitation.isDeclined) {
                    return { success: false, error: "Invitation already processed" };
                }

                if (action === 'decline') {
                    await this.repository.updateInvitation(invitationId, { isDeclined: true }, tx);
                    return { success: true, message: "Invitation declined" };
                }

                // 3. Approve
                await this.repository.updateInvitation(invitationId, { isApproved: true }, tx);

                // 4. Create Access
                await this.repository.addAccess({
                    actorAccountId: invitation.invitedAccountId!,
                    targetWorkspaceId: invitation.forWorkspaceId!,
                    viaWorkspaceId: invitation.forWorkspaceId!, // Direct access
                    accessRole: invitation.accessRole!,
                }, tx);

                return { success: true, message: "Invitation accepted" };
            });
        } catch (error) {
            this.handleError(error, "respondToInvitation");
            return { success: false, error: "Failed to respond to invitation" };
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // STAFF PROVIDER MANAGEMENT
    // ═══════════════════════════════════════════════════════════════

    async staffListProviders(options: { page?: number; pageSize?: number; search?: string; searchType?: string } = {}) {
        try {
            const result = await this.repository.listAllProviders(options);
            return { success: true, ...result };
        } catch (error) {
            this.handleError(error, "staffListProviders");
            return { success: false, error: "Failed to list providers" };
        }
    }

    async staffListProviderApplications(options: { page?: number; pageSize?: number; search?: string } = {}) {
        try {
            const result = await this.repository.listProviderApplications(options);
            return { success: true as const, ...result };
        } catch (error) {
            this.handleError(error, "staffListProviderApplications");
            return { success: false as const, error: "Failed to list provider applications" };
        }
    }

    async staffUpdateProvider(providerId: string, data: { is_active?: boolean; isBlocked?: boolean }) {
        try {
            const updatePayload: Record<string, unknown> = {};
            if (data.is_active !== undefined) updatePayload.isActive = data.is_active;
            if (data.isBlocked !== undefined) updatePayload.isBlocked = data.isBlocked;

            const updated = await this.repository.update(providerId, updatePayload);
            if (!updated) return { success: false, error: "Provider not found" };
            return { success: true, provider: updated };
        } catch (error) {
            this.handleError(error, "staffUpdateProvider");
            return { success: false, error: "Failed to update provider" };
        }
    }

    async staffDeleteProvider(providerId: string) {
        try {
            const deleted = await this.repository.deleteWorkspace(providerId);
            if (!deleted) return { success: false, error: "Provider not found" };
            return { success: true };
        } catch (error) {
            this.handleError(error, "staffDeleteProvider");
            return { success: false, error: "Failed to delete provider" };
        }
    }

    async staffEvaluateApplication(applicationId: string, approved: boolean, reason?: string) {
        try {
            if (approved) {
                const updated = await this.repository.update(applicationId, { isActive: true });
                if (!updated) return { success: false, error: "Application not found" };
                return { success: true, data: { application: updated, provider: updated } };
            } else {
                const updated = await this.repository.update(applicationId, { isBlocked: true });
                if (!updated) return { success: false, error: "Application not found" };
                return { success: true, data: { application: updated, reason } };
            }
        } catch (error) {
            this.handleError(error, "staffEvaluateApplication");
            return { success: false, error: "Failed to evaluate application" };
        }
    }
}
