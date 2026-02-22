// Canonical OTP types (merged from 3 previous sources)

import type { Timestamps } from '../base/Base.types';

// OTP Type Enum

export enum OtpType {
  EMAIL_VERIFICATION = 'email_verification',
  PHONE_VERIFICATION = 'phone_verification',
  PASSWORD_RESET = 'password_reset',
  TWO_FACTOR_AUTH_EMAIL = '2fa_email',
  TWO_FACTOR_AUTH_PHONE = '2fa_phone',
}

export type OtpTypeString = 'email_verification' | 'phone_verification' | 'password_reset' | '2fa_email' | '2fa_phone';

// OTP Configuration

export interface OtpConfig {
  length: number;
  expiryMinutes: number;
  maxAttempts: number;
  type: OtpType;
}

export interface OtpVerification {
  code: string;
  type: OtpType;
  identifier: string;
}

// OTP Entity Namespace (access-level views)

export namespace Otp {
  export interface Admin extends Timestamps {
    id: string;
    code: string;
    expireAt: string;
    userId: string;
    type: OtpTypeString;
    user?: {
      id: string;
      email: string;
      phone?: string;
    };
    isExpired: boolean;
    isUsed: boolean;
    timeRemaining: number;
    attempts: number;
  }

  export interface User extends Timestamps {
    id: string;
    type: OtpTypeString;
    expireAt: string;
    isExpired: boolean;
    timeRemaining: number;
  }

  export interface CreateInput {
    userId: string;
    type: OtpTypeString;
    expireInMinutes?: number;
  }

  export interface VerifyInput {
    userId: string;
    code: string;
    type: OtpTypeString;
  }

  export interface VerifyResult {
    success: boolean;
    message: string;
    userId?: string;
    attemptsRemaining?: number;
    nextAttemptAt?: string;
  }

  export interface SearchFilters {
    userId?: string;
    type?: OtpTypeString;
    isExpired?: boolean;
    isUsed?: boolean;
    createdAfter?: string;
    createdBefore?: string;
  }

  export interface Statistics {
    totalOtps: number;
    activeOtps: number;
    expiredOtps: number;
    usedOtps: number;
    otpsByType: Record<string, number>;
    averageVerificationTime: number;
    successRate: number;
    recentActivity: Array<{
      type: string;
      count: number;
      successRate: number;
    }>;
  }

  export interface RateLimitInfo {
    canSend: boolean;
    attemptsRemaining: number;
    nextAllowedAt?: string;
    cooldownMinutes: number;
  }
}
