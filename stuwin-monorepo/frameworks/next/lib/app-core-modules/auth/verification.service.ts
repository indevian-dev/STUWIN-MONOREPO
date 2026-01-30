import { BaseService } from "../domain/BaseService";
import { AuthRepository } from "./auth.repository";
import { AuthContext } from "@/lib/app-core-modules/types";
import { AuthResult } from "./auth.service";
import {
    generateOtp,
    storeOtp,
    getValidOtp,
    consumeOtp
} from "@/lib/utils/otpHandlingUtility";
import { sendOtpSmsPlus } from "@/lib/integrations/smsService";
import { sendMail } from "@/lib/integrations/mailService";
import { generateVerificationOtpEmail } from "@/lib/app-infrastructure/notificators/mail/mailGenerator";
import { db } from "@/lib/app-infrastructure/database";

export class VerificationService extends BaseService {
    constructor(
        private readonly repository: AuthRepository,
        private readonly ctx?: AuthContext
    ) {
        super();
    }

    async generateOtp(params: { type: 'email' | 'phone', target: string, accountId: string }): Promise<AuthResult> {
        try {
            const { type, target, accountId } = params;
            const isDevelopment = process.env.NODE_ENV === 'development';

            // 1. Uniqueness check based on type
            const normalizedTarget = type === 'email' ? target.trim().toLowerCase() : target.trim();

            const user = await this.repository.findUserById(this.ctx?.userId || "");

            if (!user) {
                return { success: false, error: 'User not found', status: 400 };
            }

            // Check if already verified with this exact target
            if (type === 'email') {
                if (normalizedTarget === user.email?.toLowerCase() && user.emailIsVerified) {
                    return { success: true, data: { alreadyVerified: true, message: 'This email address is already verified' }, status: 200 };
                }
            } else {
                if (normalizedTarget === user.phone?.trim() && user.phoneIsVerified) {
                    return { success: true, data: { alreadyVerified: true, message: 'This phone number is already verified' }, status: 200 };
                }
            }

            // Check if target exists for another user
            const exists = await this.repository.checkUserExists(
                type === 'email' ? normalizedTarget : undefined,
                type === 'phone' ? normalizedTarget : undefined
            );

            if ((type === 'email' && exists.emailExists) || (type === 'phone' && exists.phoneExists)) {
                // Check if it's the SAME user or another one
                // The repository.checkUserExists logic in the project seems to be general.
                // Let's do a more specific check here or rely on repo.
                const existingUser = type === 'email'
                    ? await this.repository.findUserByEmail(normalizedTarget)
                    : null; // Repository doesn't have findUserByPhone yet, but checkUserExists uses it.

                // For now, if it exists and it's not the current user, it's a conflict
                if (existingUser && existingUser.id !== user.id) {
                    return { success: false, error: `This ${type} is already registered to another account`, status: 400 };
                }
            }

            // 2. Generate and Store OTP
            const otpExpireSeconds = parseInt(process.env.OTP_EXPIRE_TIME || '1200', 10);
            const otpExpireMinutes = Math.ceil(otpExpireSeconds / 60);
            const { otpCode } = generateOtp();

            await storeOtp({
                accountId,
                otpCode,
                type: type === 'email' ? 'email_verification' : 'phone_verification',
                destination: normalizedTarget,
                ttlMinutes: otpExpireMinutes
            });

            // 3. Send via appropriate channel
            if (type === 'email') {
                const emailTemplate = generateVerificationOtpEmail({
                    username: accountId,
                    otp: otpCode,
                    expiryMinutes: otpExpireMinutes
                });

                const result = await sendMail({
                    to: normalizedTarget,
                    subject: 'Verification Email',
                    html: emailTemplate.html || ''
                });

                if (!result.success) {
                    return { success: false, error: 'Failed to send verification email', status: 500 };
                }
            } else {
                const result = await sendOtpSmsPlus({
                    number: normalizedTarget,
                    otp: otpCode,
                    expiryMinutes: otpExpireMinutes
                });

                if (!result.success) {
                    return { success: false, error: result.error || 'Failed to send verification SMS', status: 400 };
                }
            }

            return {
                success: true,
                status: 200,
                data: {
                    message: `Verification ${type === 'email' ? 'email' : 'SMS'} sent`,
                    devCode: isDevelopment ? otpCode : undefined
                }
            };

        } catch (error) {
            this.handleError(error, "VerificationService.generateOtp");
            return { success: false, error: 'Failed to process verification request', status: 500 };
        }
    }

    async validateOtp(params: { type: 'email' | 'phone', target: string, otp: string, accountId: string, userId: string }): Promise<AuthResult> {
        try {
            const { type, target, otp, accountId, userId } = params;
            const normalizedTarget = type === 'email' ? target.trim().toLowerCase() : target.trim();
            const otpStr = String(otp).trim();

            if (!/^\d{6}$/.test(otpStr)) {
                return { success: false, error: "OTP must be a 6-digit number", status: 400 };
            }

            // 1. Validate OTP
            const otpRecord = await getValidOtp({
                accountId,
                type: type === 'email' ? 'email_verification' : 'phone_verification',
                code: otpStr,
                destination: normalizedTarget,
            });

            if (!otpRecord) {
                return { success: false, error: "Invalid or expired OTP", status: 400 };
            }

            // 2. Update User
            const updateData: any = {
                updatedAt: new Date(),
            };
            if (type === 'email') {
                updateData.email = normalizedTarget;
                updateData.emailIsVerified = true;
            } else {
                updateData.phone = normalizedTarget;
                updateData.phoneIsVerified = true;
            }

            const updatedUser = await this.repository.updateUser(userId, updateData);
            if (!updatedUser) {
                return { success: false, error: "Failed to update user record", status: 500 };
            }

            // 3. Consume OTP
            await consumeOtp({ otpId: otpRecord.id });

            return {
                success: true,
                status: 200,
                data: {
                    message: `${type === 'email' ? 'Email' : 'Phone'} verified successfully`,
                    targetUpdated: true // Assuming it might have changed
                }
            };

        } catch (error) {
            this.handleError(error, "VerificationService.validateOtp");
            return { success: false, error: "Failed to verify", status: 500 };
        }
    }
}
