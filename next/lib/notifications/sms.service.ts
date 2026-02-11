import { BaseService } from "@/lib/domain/base/base.service";
import { AuthContext } from "@/lib/domain/base/types";
import { sendOtpSmsPlus } from "@/lib/integrations/notifications/sms.client";
import { generateGlobalSms } from "./sms.templates";
import type { NotificationResult } from "./notification.types";

/**
 * SmsService - Handles SMS sending operations
 * Uses sms templates (colocated) + sms.client (transport).
 */
export class SmsService extends BaseService {
    constructor(private readonly ctx: AuthContext) {
        super();
    }

    /**
     * Send a generic SMS message
     */
    async send(params: {
        to: string;
        title: string;
        body: { type: 'general' | 'code' | 'bold'; content: string }[];
        username?: string;
    }): Promise<NotificationResult> {
        try {
            if (!params.to || !params.title) {
                throw new Error("Missing required SMS parameters");
            }

            const smsContent = generateGlobalSms({
                title: params.title,
                body: params.body,
                username: params.username,
            });

            const result = await sendOtpSmsPlus({
                number: params.to,
                otp: smsContent.smsBody.message,
                expiryMinutes: 0,
            });

            return {
                success: result.success,
                messageId: result.code,
                error: result.error,
            };
        } catch (error) {
            this.handleError(error, "SmsService.send");
            return { success: false, error: "Failed to send SMS" };
        }
    }

    /**
     * Send OTP via SMS
     */
    async sendOtp(params: {
        to: string;
        otp: string;
        username?: string;
        expiryMinutes?: number;
        operation?: string;
    }): Promise<NotificationResult> {
        try {
            const result = await sendOtpSmsPlus({
                number: params.to,
                otp: params.otp,
                expiryMinutes: params.expiryMinutes ?? 10,
            });

            return {
                success: result.success,
                messageId: result.code,
                error: result.error,
            };
        } catch (error) {
            this.handleError(error, "SmsService.sendOtp");
            return { success: false, error: "Failed to send OTP SMS" };
        }
    }

    /**
     * Send registration verification OTP
     */
    async sendRegistrationOtp(params: {
        to: string;
        otp: string;
        username?: string;
        expiryMinutes?: number;
    }): Promise<NotificationResult> {
        return this.sendOtp({ ...params, operation: 'verification' });
    }

    /**
     * Send password reset OTP
     */
    async sendPasswordResetOtp(params: {
        to: string;
        otp: string;
        username?: string;
        expiryMinutes?: number;
    }): Promise<NotificationResult> {
        return this.sendOtp({ ...params, operation: 'password_reset' });
    }
}
