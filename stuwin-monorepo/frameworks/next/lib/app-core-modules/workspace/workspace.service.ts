
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
    async createStudentWorkspace(ownerAccountId: string, details: { displayName: string; gradeLevel?: any; providerId: string }) {
        try {
            return await this.db.transaction(async (tx) => {
                // 1. Create Student Workspace
                const studentWorkspace = await this.repository.create({
                    title: details.displayName,
                    type: "student",
                    ownerAccountId: ownerAccountId,
                    metadata: { gradeLevel: details.gradeLevel },
                    isActive: true,
                }, tx as any);

                // 2. Connect to the selected Provider (School/Center)
                // Student IS ENROLLED IN Provider
                await this.repository.connectWorkspaces({
                    fromWorkspaceId: studentWorkspace.id,
                    toWorkspaceId: details.providerId,
                    relationType: "enrolled_in",
                }, tx as any);

                return { success: true, data: studentWorkspace };
            });
        } catch (error) {
            this.handleError(error, "createStudentWorkspace");
            return { success: false, error: "Student onboarding failed" };
        }
    }
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
