// ═══════════════════════════════════════════════════════════════
// OTP ENTITY TYPES
// ═══════════════════════════════════════════════════════════════
// Domain types for OTP entity with different access levels
// ═══════════════════════════════════════════════════════════════

import type { Timestamps } from '../base';

// ═══════════════════════════════════════════════════════════════
// OTP ENTITY - ADMIN VIEW
// ═══════════════════════════════════════════════════════════════

export namespace Otp {
  export interface Admin extends Timestamps {
    id: string;
    code: string; // masked for security
    expireAt: string;
    userId: string;
    type: 'email_verification' | 'phone_verification' | 'password_reset' | '2fa_email' | '2fa_phone';
    // Relations
    user?: {
      id: string;
      email: string;
      phone?: string;
    };
    // Computed fields
    isExpired: boolean;
    isUsed: boolean;
    timeRemaining: number; // in seconds
    attempts: number;
  }

  // ═══════════════════════════════════════════════════════════════
  // OTP ENTITY - USER VIEW (Very Limited)
  // ═══════════════════════════════════════════════════════════════

  export interface User extends Timestamps {
    id: string;
    type: 'email_verification' | 'phone_verification' | 'password_reset' | '2fa_email' | '2fa_phone';
    expireAt: string;
    // Very limited information for security
    isExpired: boolean;
    timeRemaining: number; // in seconds
  }

  // ═══════════════════════════════════════════════════════════════
  // OTP CREATION & VERIFICATION TYPES
  // ═══════════════════════════════════════════════════════════════

  export interface CreateInput {
    userId: string;
    type: 'email_verification' | 'phone_verification' | 'password_reset' | '2fa_email' | '2fa_phone';
    expireInMinutes?: number; // default 10 minutes
  }

  export interface VerifyInput {
    userId: string;
    code: string;
    type: 'email_verification' | 'phone_verification' | 'password_reset' | '2fa_email' | '2fa_phone';
  }

  export interface VerifyResult {
    success: boolean;
    message: string;
    userId?: string;
    attemptsRemaining?: number;
    nextAttemptAt?: string;
  }

  // ═══════════════════════════════════════════════════════════════
  // OTP SEARCH & FILTERING (Admin Only)
  // ═══════════════════════════════════════════════════════════════

  export interface SearchFilters {
    userId?: string;
    type?: 'email_verification' | 'phone_verification' | 'password_reset' | '2fa_email' | '2fa_phone';
    isExpired?: boolean;
    isUsed?: boolean;
    createdAfter?: string;
    createdBefore?: string;
  }

  // ═══════════════════════════════════════════════════════════════
  // OTP STATISTICS
  // ═══════════════════════════════════════════════════════════════

  export interface Statistics {
    totalOtps: number;
    activeOtps: number;
    expiredOtps: number;
    usedOtps: number;
    otpsByType: Record<string, number>;
    averageVerificationTime: number; // in seconds
    successRate: number;
    recentActivity: Array<{
      type: string;
      count: number;
      successRate: number;
    }>;
  }

  // ═══════════════════════════════════════════════════════════════
  // OTP RATE LIMITING
  // ═══════════════════════════════════════════════════════════════

  export interface RateLimitInfo {
    canSend: boolean;
    attemptsRemaining: number;
    nextAllowedAt?: string;
    cooldownMinutes: number;
  }
}

