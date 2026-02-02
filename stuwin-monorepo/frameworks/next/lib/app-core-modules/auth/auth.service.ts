
import { AuthRepository } from "./auth.repository";
import { BaseService } from "../domain/BaseService";
import { verifyPassword, validatePassword, hashPassword } from "@/lib/utils/passwordUtility";
import { cleanPhoneNumber, validateAzerbaijanPhone } from "@/lib/utils/phoneFormatterUtility";
import { generateSlimId } from "@/lib/utils/slimUlidUtility";
import { SessionAuthenticator } from "@/lib/app-access-control/authenticators/SessionAuthenticator";
import { assignAccountScope, mapSkopeTypeToDomain, type SkopeType } from "@/lib/utils/skopeUtility";
import { v4 as uuidv4 } from "uuid";
import type { AuthContext } from "@/lib/app-core-modules/types";
import {
    storeAndSendRegistrationOtp,
    getValidOtp,
    consumeOtp,
    issueOtp,
    type OtpType
} from "@/lib/utils/otpHandlingUtility";
import { sendMail } from '@/lib/integrations/mailService';
import { generateVerificationOtpEmail } from '@/lib/app-infrastructure/notificators/mail/mailGenerator';
import { sendOtpSmsPlus } from '@/lib/integrations/smsService';
import s3 from "@/lib/integrations/awsClient";
import { GetObjectCommand, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export interface LoginParams {
    email: string;
    password: string;
    deviceInfo?: { userAgent?: string };
    ip?: string;
}

export interface RegisterParams {
    firstName: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
    userAgent?: string;
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

            // For now, use the first workspace found as active.
            const activeWorkspace = allWorkspaces[0];
            const workspaceType = activeWorkspace?.type;

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

    async register(params: RegisterParams): Promise<AuthResult> {
        try {
            const { firstName, email, phone, password, confirmPassword } = params;

            // 1. Validation
            const formError: Record<string, string> = {};
            if (!firstName) formError.name = "Name is required";
            if (!email) formError.email = "Email is required";
            if (!phone) formError.phone = "Phone is required";
            if (!password) formError.password = "Password is required";
            if (!confirmPassword) formError.confirmPassword = "Confirm password is required";

            if (Object.keys(formError).length > 0) {
                return { success: false, formError, status: 400 };
            }

            if (password !== confirmPassword) {
                return { success: false, formError: { confirmPassword: "Passwords do not match" }, status: 400 };
            }

            const { isPasswordValid, validatedPassword } = await validatePassword({ password });
            if (!isPasswordValid || !validatedPassword) {
                return { success: false, formError: { password: "Please provide a valid password" }, status: 400 };
            }

            const cleanedPhone = cleanPhoneNumber(phone);
            if (!validateAzerbaijanPhone(cleanedPhone)) {
                return { success: false, formError: { phone: "Please provide a valid Azerbaijan phone number" }, status: 400 };
            }

            // 2. Conflict Check
            const conflicts = await this.repository.checkUserExists(email, cleanedPhone);
            if (conflicts.emailExists) {
                return { success: false, formError: { email: "Email already registered" }, status: 400 };
            }
            if (conflicts.phoneExists) {
                return { success: false, formError: { phone: "Phone number already registered" }, status: 400 };
            }

            // 3. Password Hashing
            const { hashedPassword } = await hashPassword({ password: validatedPassword });

            // 4. User Creation (Transaction)
            const userId = generateSlimId();
            const accountId = generateSlimId();
            const workspaceId = generateSlimId();
            const sessionsGroupId = generateSlimId();

            const { user, account } = await this.repository.createUserWithAccount({
                id: userId,
                email,
                phone: cleanedPhone,
                firstName,
                passwordHash: hashedPassword,
                sessionsGroupId,
                accountId,
                workspaceId
            });

            // 5. OTP Sending
            const otpExpireSeconds = parseInt(process.env.OTP_EXPIRE_TIME || "1200", 10);
            const otpExpireMinutes = Math.ceil(otpExpireSeconds / 60);

            const otpResult = await storeAndSendRegistrationOtp({
                accountId: account.id,
                email: user.email,
                phone: user.phone || undefined,
                type: "email_verification",
                ttlMinutes: otpExpireMinutes,
            });

            // 6. Session Creation
            const sessionResult = await SessionAuthenticator.createSession({
                accountId: account.id,
                sessionsGroupId,
                ip: params.ip || "0.0.0.0",
                userAgent: params.userAgent || "unknown",
            });

            if (!sessionResult) {
                // Rollback manual as we're outside the creation transaction
                await this.repository.deleteUser(user.id);
                return { success: false, error: "Failed to create session", status: 500 };
            }

            return {
                success: true,
                status: 201,
                data: {
                    message: "Registration successful",
                    user,
                    account,
                    session: {
                        id: sessionResult.sessionId,
                        expires_at: sessionResult.expireAt,
                    },
                    verificationSent: {
                        email: otpResult.emailSent,
                        sms: otpResult.smsSent,
                    },
                    otp: process.env.NODE_ENV !== "production" ? otpResult.otp : undefined
                }
            };

        } catch (error) {
            console.error("[AuthService] Register error:", error);
            return {
                success: false,
                error: "An error occurred during registration",
                status: 500,
            };
        }
    }

    async requestVerificationCode(params: {
        email?: string;
        phone?: string;
        operation: 'verification' | 'password_reset' | '2fa' | 'email_change' | 'phone_change';
    }): Promise<AuthResult> {
        try {
            const { email, phone, operation } = params;

            const hasEmail = typeof email === 'string' && email.trim().length > 0;
            const hasPhone = typeof phone === 'string' && phone.trim().length > 0;

            if (!hasEmail && !hasPhone) return { success: false, error: 'Email or phone is required', status: 400 };
            if (hasEmail && hasPhone) return { success: false, error: 'Provide only one of email or phone', status: 400 };

            const channel = hasEmail ? 'email' : 'phone';
            const normalizedTarget = hasEmail ? email!.trim().toLowerCase() : phone!.trim();

            // Map operation to proper OTP type
            let verifyType: OtpType;
            if (operation === 'verification') {
                verifyType = hasEmail ? 'email_verification' : 'phone_verification';
            } else if (operation === 'email_change') {
                verifyType = 'email_change' as OtpType;
            } else if (operation === 'phone_change') {
                verifyType = 'phone_change' as OtpType;
            } else {
                verifyType = operation as OtpType;
            }

            // Find user and their account
            const user = await this.repository.findUserWithAccountByContact({
                email: hasEmail ? normalizedTarget : undefined,
                phone: hasPhone ? normalizedTarget : undefined
            });

            if (!user) return { success: false, error: 'User not found', status: 400 };
            if (!user.accountId) return { success: false, error: 'Account not found for this user', status: 400 };

            if (operation === 'verification') {
                if (channel === 'email' && user.emailIsVerified) {
                    return { success: true, status: 200, data: { alreadyVerified: true, message: 'Email already verified' } };
                }
                if (channel === 'phone' && user.phoneIsVerified) {
                    return { success: true, status: 200, data: { alreadyVerified: true, message: 'Phone already verified' } };
                }
            }

            // Get OTP expiry from env (in seconds) and convert to minutes
            const otpExpireSeconds = parseInt(process.env.OTP_EXPIRE_TIME || '1200', 10);
            const otpExpireMinutes = Math.ceil(otpExpireSeconds / 60);

            const otp = await issueOtp({
                accountId: user.accountId,
                type: verifyType,
                destination: normalizedTarget,
                ttlMinutes: otpExpireMinutes
            });

            if (channel === 'email') {
                const emailSubjects: Record<string, string> = {
                    verification: 'Verify Your Email - stuwin.ai',
                    password_reset: 'Password Reset - stuwin.ai',
                    '2fa': 'Two-Factor Authentication - stuwin.ai',
                    email_change: 'Verify Your New Email - stuwin.ai',
                    phone_change: 'Verify Email for Phone Change - stuwin.ai'
                };

                const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email || 'User';

                const { html } = generateVerificationOtpEmail({
                    username: fullName,
                    otp,
                    expiryMinutes: otpExpireMinutes
                });

                const result = await sendMail({
                    to: user.email,
                    subject: emailSubjects[operation] || 'Verification Code - stuwin.ai',
                    html: html || ''
                });

                if (!result?.success) return { success: false, error: 'Failed to send verification email', status: 500 };
            } else {
                const sms = await sendOtpSmsPlus({
                    number: user.phone || '',
                    otp,
                    expiryMinutes: otpExpireMinutes
                });

                if (!sms?.success) {
                    return { success: false, error: sms?.error || 'Failed to send verification SMS', status: 500 };
                }
            }

            const operationMessages: Record<string, string> = {
                verification: `Verification code sent to ${channel}`,
                password_reset: `Password reset code sent to ${channel}`,
                '2fa': `Two-factor authentication code sent to ${channel}`,
                email_change: `Email change verification code sent to ${channel}`,
                phone_change: `Phone change verification code sent to ${channel}`
            };

            const data: any = {
                message: operationMessages[operation] || `Verification code sent to ${channel}`,
                operation,
                channel
            };
            if (process.env.NODE_ENV !== 'production') data.devCode = otp;

            return { success: true, status: 200, data };

        } catch (error) {
            console.error("[AuthService] requestVerificationCode error:", error);
            return { success: false, error: "Failed to process verification request", status: 500 };
        }
    }

    async verifyAndResetPassword(params: {
        email: string;
        password: string;
        confirmPassword: string;
        otp: string;
    }): Promise<AuthResult> {
        try {
            const { email, password, confirmPassword, otp } = params;

            if (!email || !password || !confirmPassword || !otp) {
                return { success: false, error: 'Email, password, confirmPassword, and OTP are required', status: 400 };
            }

            if (password !== confirmPassword) {
                return { success: false, error: 'Passwords do not match', status: 400 };
            }

            const { isPasswordValid, validatedPassword } = await validatePassword({ password });
            if (!isPasswordValid || !validatedPassword) {
                return { success: false, error: 'Please provide a valid password (min 8 chars, 1 number)', status: 400 };
            }

            const normalizedEmail = email.trim().toLowerCase();

            // Find user and their account
            const user = await this.repository.findUserWithAccountByContact({ email: normalizedEmail });
            if (!user) return { success: false, error: 'Invalid email or OTP', status: 400 };
            if (!user.accountId) return { success: false, error: 'Account not found for this user', status: 400 };

            // Check OTP validity
            const validOtp = await getValidOtp({
                accountId: user.accountId,
                type: 'password_reset' as OtpType,
                code: otp,
                destination: normalizedEmail
            });

            if (!validOtp) return { success: false, error: 'Invalid or expired OTP', status: 400 };

            // Hash the password
            const { hashedPassword } = await hashPassword({ password: validatedPassword });

            // Update user password
            await this.repository.updateUserPassword(user.id, hashedPassword);

            // Consume the OTP
            await consumeOtp({ otpId: validOtp.id });

            return {
                success: true,
                status: 200,
                data: {
                    message: 'Password has been reset successfully'
                }
            };
        } catch (error) {
            console.error("[AuthService] verifyAndResetPassword error:", error);
            return { success: false, error: "An error occurred during password reset", status: 500 };
        }
    }

    async updateContactInfo(userId: string, params: { email?: string; phone?: string }): Promise<AuthResult> {
        try {
            const { email, phone } = params;

            if (!email && !phone) {
                return { success: false, error: 'Either email or phone must be provided', status: 400 };
            }

            if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                return { success: false, error: 'Invalid email format', status: 400, formError: { email: 'Invalid email format' } };
            }

            let cleanedPhone = null;
            if (phone) {
                cleanedPhone = cleanPhoneNumber(phone);
                if (!validateAzerbaijanPhone(cleanedPhone)) {
                    return { success: false, error: 'Please provide a valid Azerbaijan phone number', status: 400, formError: { phone: 'Invalid phone number' } };
                }
            }

            // Verify user existence and verification status
            const user = await this.repository.findUserById(userId);
            if (!user) return { success: false, error: 'User not found', status: 404 };

            if (user.emailIsVerified) {
                return {
                    success: false,
                    error: 'Cannot update contact information for verified users. Please use account settings instead.',
                    status: 400
                };
            }

            // Availability check
            const availability = await this.repository.checkContactAvailability({
                email,
                phone: cleanedPhone || undefined,
                excludeUserId: userId
            });

            if (availability.emailTaken) {
                return { success: false, error: 'This email is already registered and verified', status: 400, formError: { email: 'Email taken' } };
            }
            if (availability.phoneTaken) {
                return { success: false, error: 'This phone number is already registered and verified', status: 400, formError: { phone: 'Phone taken' } };
            }

            // Update contact information
            const updateData: any = {};
            if (email) updateData.email = email;
            if (cleanedPhone) updateData.phone = cleanedPhone;

            const updatedUser = await this.repository.updateUser(userId, updateData);

            return {
                success: true,
                status: 200,
                data: {
                    message: 'Contact information updated successfully',
                    user: {
                        id: updatedUser!.id,
                        email: updatedUser!.email,
                        phone: updatedUser!.phone,
                        emailVerified: updatedUser!.emailIsVerified,
                        phoneVerified: updatedUser!.phoneIsVerified
                    }
                }
            };
        } catch (error) {
            console.error("[AuthService] updateContactInfo error:", error);
            return { success: false, error: "Failed to update contact information", status: 500 };
        }
    }

    async getAccountProfile(accountId: string, workspaceId?: string): Promise<AuthResult> {
        try {
            const data = await this.repository.findAccountProfile(accountId, workspaceId);
            if (!data) return { success: false, error: "Account not found", status: 404 };

            const profile = {
                account: {
                    id: data.account.id,
                    created_at: data.account.createdAt,
                    updated_at: data.account.updatedAt,
                    suspended: data.account.suspended,
                    role: data.role ? {
                        id: data.role.id,
                        name: data.role.name,
                        permissions: data.role.permissions
                    } : null,
                    is_personal: workspaceId === undefined,
                },
                user: {
                    id: data.user?.id,
                    email: data.user?.email,
                    name: data.user?.firstName,
                    last_name: data.user?.lastName,
                    avatar_url: await this.getAvatarUrl(data.user!.id),
                    phone: data.user?.phone,
                    email_is_verified: data.user?.emailIsVerified,
                    phone_is_verified: data.user?.phoneIsVerified,
                },
                permissions: (data.role?.permissions as string[]) || []
            };

            return {
                success: true,
                status: 200,
                data: profile
            };
        } catch (error) {
            console.error("[AuthService] getAccountProfile error:", error);
            return { success: false, error: "Internal server error", status: 500 };
        }
    }

    async listUsers(page: number = 1, pageSize: number = 10) {
        try {
            const offset = (page - 1) * pageSize;
            const users = await this.repository.listUsersWithAccounts({ limit: pageSize, offset });
            const total = await this.repository.countUsers();

            return {
                success: true,
                data: {
                    users,
                    total,
                    page,
                    pageSize
                }
            };
        } catch (error) {
            console.error("[AuthService] listUsers error:", error);
            return { success: false, error: "Failed to list users", status: 500 };
        }
    }

    async getUserDetails(userId: string) {
        try {
            const user = await this.repository.findUserById(userId);
            if (!user) return { success: false, error: "User not found", status: 404 };

            const accounts = await this.repository.findAccountsByUserId(userId);

            return {
                success: true,
                data: {
                    user: {
                        ...user,
                        accounts
                    }
                }
            };
        } catch (error) {
            console.error("[AuthService] getUserDetails error:", error);
            return { success: false, error: "Failed to get user details", status: 500 };
        }
    }

    async deleteUser(userId: string) {
        try {
            const result = await this.repository.deleteUser(userId);

            if (!result.deletedUser) {
                return { success: false, error: "User not found", status: 404 };
            }

            return {
                success: true,
                data: {
                    userId: result.deletedUser.id,
                    userEmail: result.deletedUser.email,
                    disconnectedAccounts: result.disconnectedAccounts
                }
            };
        } catch (error) {
            console.error("[AuthService] deleteUser error:", error);
            return { success: false, error: "Failed to delete user", status: 500 };
        }
    }

    async updateUserVerification(userId: string, data: { emailVerified?: boolean; phoneVerified?: boolean }) {
        try {
            const updateData: any = {};
            if (data.emailVerified !== undefined) updateData.emailIsVerified = data.emailVerified;
            if (data.phoneVerified !== undefined) updateData.phoneIsVerified = data.phoneVerified;

            if (Object.keys(updateData).length === 0) {
                return { success: false, error: "Nothing to update", status: 400 };
            }

            const updatedUser = await this.repository.updateUser(userId, updateData);
            if (!updatedUser) {
                return { success: false, error: "User not found", status: 404 };
            }

            return { success: true, user: updatedUser };
        } catch (error) {
            console.error("[AuthService] updateUserVerification error:", error);
            return { success: false, error: "Failed to update user verification", status: 500 };
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
                    subscriptions: []
                }
            };
        } catch (error) {
            console.error("[AuthService] getAuthProfile error:", error);
            return { success: false, error: "Internal server error occurred", status: 500 };
        }
    }

    async updateProfile(userId: string, data: { firstName?: string; lastName?: string; phone?: string; avatarBase64?: string }): Promise<AuthResult> {
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
                        phone: updatedUser.phone,
                        avatarBase64: updatedUser.avatarBase64
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
