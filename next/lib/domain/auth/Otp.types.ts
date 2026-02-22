// ═══════════════════════════════════════════════════════════════
// OTP MODULE TYPES
// ═══════════════════════════════════════════════════════════════

export type OtpType =
    | 'email_verification'
    | 'phone_verification'
    | 'password_reset'
    | '2fa_email'
    | '2fa_phone';

export interface OtpRecord {
    id: string;
    accountId: string | null;
    code: string | null;
    type: OtpType | null;
    expireAt: Date | null;
    createdAt: Date;
    destination: string | null;
}

export interface RecentOtpRecord {
    id: string;
    createdAt: Date;
    expireAt: Date | null;
}

export interface StoreOtpParams {
    otpCode: string;
    accountId: string;
    type: OtpType;
    destination: string;
    ttlMinutes?: number;
}

export interface StoreOtpResult {
    storedOtp: string | null;
    isOtpIssued: boolean;
    error?: string;
}

export interface StoreAndSendOtpResult {
    success: boolean;
    otp: string | null;
    emailSent: boolean;
    smsSent: boolean;
    emailError?: string | null;
    smsError?: string | null;
    error?: string;
}
