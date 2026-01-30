
import { AuthRepository } from "./auth.repository";
import { BaseService } from "../domain/BaseService";
import { verifyPassword } from "@/lib/utils/passwordUtility";
import { SessionAuthenticator } from "@/lib/app-access-control/authenticators/SessionAuthenticator";
import { assignAccountScope, mapSkopeTypeToDomain, type SkopeType } from "@/lib/utils/skopeUtility";
import { v4 as uuidv4 } from "uuid";
import type { AuthContext } from "@/lib/app-core-modules/types";
import {
    storeAndSendRegistrationOtp,
    getValidOtp,
    consumeOtp
} from "@/lib/utils/otpHandlingUtility";
import s3 from "@/lib/integrations/awsClient";
import { GetObjectCommand, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export interface LoginParams {
    email: string;
    password: string;
    deviceInfo?: { userAgent?: string };
    ip?: string;
}

export interface AuthResult {
    success: boolean;
    data?: any;
    error?: string;
    formError?: Record<string, string>;
    status: number;
}

import { PaymentRepository } from "../payment/payment.repository";

export class AuthService extends BaseService {
    constructor(
        private readonly repository: AuthRepository,
        private readonly paymentRepo: PaymentRepository,
        private readonly ctx?: AuthContext
    ) {
        super();
    }

    async login(params: LoginParams): Promise<AuthResult> {
        try {
            const { email, password } = params;

            const user = await this.repository.findUserByEmail(email);
            if (!user || !user.password) {
                console.log("[AuthService] Login failed: User not found or no password", { email });
                return {
                    success: false,
                    formError: { email: "Invalid email or password", password: "Invalid email or password" },
                    status: 401,
                };
            }

            const { isPasswordValid } = await verifyPassword({
                inputPassword: password,
                storedPassword: user.password,
            });

            if (!isPasswordValid) {
                console.log("[AuthService] Login failed: Invalid password", { email });
                return {
                    success: false,
                    formError: { email: "Invalid email or password", password: "Invalid email or password" },
                    status: 401,
                };
            }

            // --- 0. Pre-login checks (Account retrieval) ---
            const account = await this.repository.findAccountByUserId(user.id);
            if (!account) {
                return {
                    success: false,
                    error: "No account associated with this user",
                    status: 401,
                };
            }

            // Create a session in the database
            const session = await SessionAuthenticator.createSession({
                accountId: account.id,
                sessionsGroupId: user.sessionsGroupId || uuidv4(),
                userAgent: params.deviceInfo?.userAgent || "unknown",
                ip: params.ip || "0.0.0.0",
                // metadata: { ...params.deviceInfo }
            });

            if (!session) {
                return {
                    success: false,
                    error: "Failed to create session",
                    status: 500,
                };
            }

            // Determine workspace type and default workspace
            const { owned, connected } = await this.repository.listWorkspacesByAccountId(account.id);
            const allWorkspaces = [...owned, ...connected];

            // For now, use the first workspace found as active, or prioritize personal
            const personalWorkspace = allWorkspaces.find(w => w.type === 'personal');
            const activeWorkspace = personalWorkspace || allWorkspaces[0];
            const workspaceType = activeWorkspace?.type || 'personal';

            return {
                success: true,
                status: 200,
                data: {
                    message: "Logged in successfully",
                    session: session.sessionId,
                    expireAt: session.expireAt,
                },
            };
        } catch (error) {
            console.error("[AuthService] Login error:", error);
            return {
                success: false,
                error: "Internal server error occurred",
                status: 500,
            };
        }
    }

    async getAuthProfile(): Promise<AuthResult> {
        try {
            if (!this.ctx?.userId) {
                // Return null profile instead of 401 to avoid redirect loops
                return {
                    success: true,
                    status: 200,
                    data: {
                        user: null,
                        account: null,
                        subscriptions: []
                    }
                };
            }

            const user = await this.repository.findUserById(this.ctx.userId);
            if (!user) {
                return { success: false, error: "User not found", status: 404 };
            }

            const account = await this.repository.findAccountByUserId(user.id);
            if (!account) {
                return { success: false, error: "Account not found", status: 404 };
            }

            // Fetch active subscriptions from new table
            const activeSubscriptions = await this.paymentRepo.getActiveSubscriptions(account.id);

            return {
                success: true,
                status: 200,
                data: {
                    user: {
                        id: user.id,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        email: user.email,
                        phone: user.phone,
                        emailVerified: user.emailIsVerified,
                        phoneVerified: user.phoneIsVerified,
                        avatarUrl: await this.getAvatarUrl(user.id),
                    },
                    account: {
                        id: account.id,
                        subscriptionType: (account as any).subscriptionType, // Legacy
                        subscribedUntil: (account as any).subscribedUntil, // Legacy
                    },
                    subscriptions: activeSubscriptions
                }
            };
        } catch (error) {
            console.error("[AuthService] getAuthProfile error:", error);
            return { success: false, error: "Internal server error occurred", status: 500 };
        }
    }

    async updateProfile(userId: string, data: { firstName?: string; lastName?: string }): Promise<AuthResult> {
        try {
            const updatedUser = await this.repository.updateUser(userId, data);
            if (!updatedUser) {
                return { success: false, error: "User not found", status: 404 };
            }

            return {
                success: true,
                status: 200,
                data: {
                    message: "Profile updated successfully",
                    user: {
                        id: updatedUser.id,
                        firstName: updatedUser.firstName,
                        lastName: updatedUser.lastName,
                    }
                }
            };
        } catch (error) {
            console.error("[AuthService] updateProfile error:", error);
            return { success: false, error: "Internal server error occurred", status: 500 };
        }
    }

    async getAvatarUploadUrl(userId: string): Promise<AuthResult> {
        try {
            const bucket = process.env.AWS_S3_BUCKET_NAME!;
            const key = `${userId}/avatar/avatar.webp`;

            const command = new PutObjectCommand({
                Bucket: bucket,
                Key: key,
                ContentType: "image/webp",
            });

            const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

            return {
                success: true,
                status: 200,
                data: { uploadUrl }
            };
        } catch (error) {
            console.error("[AuthService] getAvatarUploadUrl error:", error);
            return { success: false, error: "Failed to generate upload URL", status: 500 };
        }
    }

    private async getAvatarUrl(userId: string): Promise<string | null> {
        try {
            const bucket = process.env.AWS_S3_BUCKET_NAME!;
            const key = `${userId}/avatar/avatar.webp`;

            // Check if object exists
            try {
                await s3.send(new HeadObjectCommand({
                    Bucket: bucket,
                    Key: key,
                }));
            } catch (err: any) {
                if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
                    return null;
                }
                // For other errors, we might still want to try to return a URL if it's just a permission issue on HeadObject
                // but usually NotFound is what we care about
            }

            const command = new GetObjectCommand({
                Bucket: bucket,
                Key: key,
            });

            return await getSignedUrl(s3, command, { expiresIn: 86400 }); // 24 hours
        } catch (error) {
            // Silently fail and return null for avatar if there's an issue
            return null;
        }
    }
}
