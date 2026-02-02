
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
        const allowedTypes = ['student', 'provider', 'staff', 'parent'];
        if (!allowedTypes.includes(details.type)) {
            return { success: false, error: `Invalid workspace type: ${details.type}` };
        }

        try {
            return await this.db.transaction(async (tx) => {
                const workspace = await this.repository.create({
                    title: details.title,
                    type: details.type,
                    profile: (details as any).profile || (details.metadata as any) || {},
                    isActive: true,
                }, tx as any);

                // Add Owner Access (Direct)
                // Role: 'manager' is typically the owner role for Provider/Staff.
                // For Student/Parent, it might be 'owner' or specific. Using 'manager' as generic owner role for now.
                // Ensure 'manager' role exists in seed data.
                await this.repository.addAccess({
                    actorAccountId: ownerAccountId,
                    targetWorkspaceId: workspace.id,
                    viaWorkspaceId: workspace.id,
                    accessRole: 'manager',
                }, tx as any);

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
                }, tx as any);

                // 2. Add Parent Owner Access
                await this.repository.addAccess({
                    actorAccountId: ownerAccountId,
                    targetWorkspaceId: parentWorkspace.id,
                    viaWorkspaceId: parentWorkspace.id,
                    accessRole: 'manager', // Owner of Parent Workspace
                }, tx as any);

                // 3. Connect to all selected student workspaces
                // Parent accesses Student Workspace VIA Parent Workspace
                for (const studentWsId of studentWorkspaceIds) {
                    await this.repository.addAccess({
                        actorAccountId: ownerAccountId, // Parent User
                        targetWorkspaceId: studentWsId, // Student Workspace
                        viaWorkspaceId: parentWorkspace.id, // Via Parent Dashboard
                        accessRole: 'parent_monitor', // Role in Student Workspace
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
     * Provider Flow: Create organization workspace (Inactive until Staff approval)
     */
    async submitProviderApplication(ownerAccountId: string, details: { title: string; metadata: any }, type: string = "provider") {
        try {
            return await this.db.transaction(async (tx) => {
                const workspace = await this.repository.create({
                    title: details.title,
                    type: type,
                    profile: details.metadata || {}, // Mapping legacy metadata to profile
                    isActive: false, // Must be approved by Staff
                }, tx as any);

                // Add Owner Access (but workspace is inactive)
                await this.repository.addAccess({
                    actorAccountId: ownerAccountId,
                    targetWorkspaceId: workspace.id,
                    viaWorkspaceId: workspace.id,
                    accessRole: 'manager',
                }, tx as any);

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
    async createStudentWorkspace(ownerAccountId: string, details: { displayName: string; gradeLevel?: any; providerId: string }) {
        try {
            return await this.db.transaction(async (tx) => {
                // 0. Check if already enrolled to prevent double-workspace creation
                const existing = await this.repository.findAccess(ownerAccountId, details.providerId, undefined, tx as any);
                if (existing) {
                    return { success: false, error: "Already enrolled in this provider", code: "ALREADY_ENROLLED" };
                }

                // 1. Fetch Provider to get trial days from its profile
                const provider = await this.repository.findById(details.providerId, tx as any);
                const profile = provider?.profile as any;
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
                }, tx as any);

                // 3. Add Student Owner Access (Direct)
                await this.repository.addAccess({
                    actorAccountId: ownerAccountId,
                    targetWorkspaceId: studentWorkspace.id,
                    viaWorkspaceId: studentWorkspace.id,
                    accessRole: 'student', // Student is 'student' role in their own workspace? Or 'manager'? 
                    // Usually 'student' role implies learning features.
                }, tx as any);

                // 4. Connect to the selected Provider (School/Center)
                // Student IS ENROLLED IN Provider
                // Actor: Student, Target: Provider, Via: StudentWorkspace
                await this.repository.addAccess({
                    actorAccountId: ownerAccountId,
                    targetWorkspaceId: details.providerId,
                    viaWorkspaceId: studentWorkspace.id,
                    accessRole: 'student', // Role in Provider is 'student'
                    subscribedUntil: subscribedUntil, // Subscription is ON the access to Provider
                }, tx as any);

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

            const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
            const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

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

            const { S3Client, DeleteObjectCommand, HeadObjectCommand } = require("@aws-sdk/client-s3");

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
            } catch (headErr: any) {
                if (headErr && headErr.name === "NotFound") {
                    return { success: true, message: "File deleted successfully" };
                }
                throw headErr;
            }
        } catch (error) {
            this.handleError(error, "deleteUserMedia");
            return { success: false, error: "Failed to delete file" };
        }
    }
}
