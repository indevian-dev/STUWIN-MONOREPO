import { BaseService } from "../base/base.service";
import { OtpRepository } from './otp.repository';
import { sendMail } from '@/lib/integrations/notifications/mail.client';
import { sendOtpSmsPlus } from '@/lib/integrations/notifications/sms.client';
import { generateVerificationOtpEmail } from "@/lib/notifications/mail.templates";
import { generateVerificationOtpSms } from "@/lib/notifications/sms.templates";

import type { OtpType, OtpRecord, RecentOtpRecord, StoreOtpResult, StoreAndSendOtpResult } from './otp.types';

/**
 * OtpService — Business logic for OTP generation, delivery, and validation
 */
export class OtpService extends BaseService {
    constructor(private readonly repository: OtpRepository) {
        super();
    }

    /**
     * Generate a random 6-digit OTP code
     */
    generateCode(): string {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    /**
     * Store an OTP in the database
     */
    async store(params: {
        otpCode: string;
        accountId: string;
        type: OtpType;
        destination: string;
        ttlMinutes?: number;
    }): Promise<StoreOtpResult> {
        return this.repository.store(params);
    }

    /**
     * Validate an OTP against the database (check if valid and non-expired)
     */
    async validate(params: {
        accountId: string;
        type: OtpType;
        otp: string;
        destination?: string;
    }): Promise<boolean> {
        const result = await this.repository.findValid({
            accountId: params.accountId,
            type: params.type,
            code: params.otp,
            destination: params.destination
        });
        return result !== null;
    }

    /**
     * Check if a recent OTP exists (created less than 2 minutes ago)
     */
    async checkRecentExists(params: {
        accountId: string;
        type: OtpType;
    }): Promise<RecentOtpRecord | null> {
        return this.repository.findRecent(params);
    }

    /**
     * Check if any active (non-expired) OTP exists
     */
    async checkExists(params: {
        accountId: string;
        type: OtpType;
    }): Promise<RecentOtpRecord | null> {
        return this.repository.findActive(params);
    }

    /**
     * Issue OTP — generate a code and store it
     */
    async issue(params: {
        accountId: string;
        type: OtpType;
        destination: string;
        ttlMinutes?: number;
    }): Promise<string> {
        const otpCode = this.generateCode();
        await this.repository.store({
            otpCode,
            accountId: params.accountId,
            type: params.type,
            destination: params.destination,
            ttlMinutes: params.ttlMinutes ?? 10
        });
        return otpCode;
    }

    /**
     * Get a valid OTP record from the database
     */
    async getValid(params: {
        accountId: string;
        type: OtpType;
        code: string;
        destination?: string;
    }): Promise<OtpRecord | null> {
        return this.repository.findValid(params);
    }

    /**
     * Consume (delete) an OTP after verification
     */
    async consume(otpId: string): Promise<void> {
        return this.repository.consume(otpId);
    }

    /**
     * Legacy function for email OTP verification
     * @deprecated Use getValid + consume instead
     */
    async verifyEmail(accountId: string, otp: string): Promise<{ accountId: string } | null> {
        const validOtp = await this.repository.findValid({
            accountId,
            type: 'email_verification',
            code: otp
        });

        if (!validOtp) return null;

        await this.repository.consume(validOtp.id);
        return { accountId };
    }

    /**
     * Store and send registration OTP to both email and phone
     */
    async storeAndSendRegistration(params: {
        accountId: string;
        email?: string;
        phone?: string;
        type?: OtpType;
        ttlMinutes?: number;
    }): Promise<StoreAndSendOtpResult> {
        const { accountId, email, phone, type = 'email_verification', ttlMinutes = 10 } = params;

        try {
            // Generate OTP
            const otpCode = this.generateCode();

            // Store OTP in database
            const { isOtpIssued } = await this.repository.store({
                otpCode,
                accountId,
                type,
                destination: (type === 'phone_verification' || type === '2fa_phone') ? (phone || '') : (email || ''),
                ttlMinutes
            });

            if (!isOtpIssued) {
                return { success: false, error: 'Failed to store OTP', emailSent: false, smsSent: false, otp: null };
            }

            // Initialize result tracking
            let emailSent = false;
            let smsSent = false;
            let emailError: string | null = null;
            let smsError: string | null = null;

            // Send OTP via email
            if (email) {
                try {
                    const emailTemplate = generateVerificationOtpEmail({
                        username: email.split('@')[0],
                        otp: otpCode,
                        expiryMinutes: ttlMinutes
                    });

                    const emailResult = await sendMail({
                        to: email,
                        subject: 'Verification Code - Complete Your Registration',
                        html: emailTemplate.html || ''
                    });

                    emailSent = emailResult.success;
                    if (!emailResult.success) {
                        emailError = emailResult.error || 'Failed to send email';
                    }
                } catch (error) {
                    const err = error instanceof Error ? error : new Error(String(error));
                    emailError = err.message;
                }
            }

            // Send OTP via SMS
            if (phone) {
                try {
                    generateVerificationOtpSms({
                        username: phone,
                        otp: otpCode,
                        expiryMinutes: ttlMinutes
                    });

                    const smsResult = await sendOtpSmsPlus({
                        number: phone,
                        otp: otpCode,
                        expiryMinutes: ttlMinutes
                    });

                    smsSent = smsResult.success;
                    if (!smsResult.success) {
                        smsError = smsResult.error || 'Failed to send SMS';
                    }
                } catch (error) {
                    const err = error instanceof Error ? error : new Error(String(error));
                    smsError = err.message;
                }
            }

            return { success: emailSent || smsSent, otp: otpCode, emailSent, smsSent, emailError, smsError };
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            return { success: false, error: err.message, emailSent: false, smsSent: false, otp: null };
        }
    }
}
