// ═══════════════════════════════════════════════════════════════
// TWO-FACTOR AUTHENTICATION TYPES
// ═══════════════════════════════════════════════════════════════
// Types for 2FA and verification

export enum TwoFactorMethod {
  EMAIL = 'email',
  SMS = 'sms',
  APP = 'app',
}

export interface TwoFactorSetup {
  method: TwoFactorMethod;
  secret?: string; // for TOTP apps
  backupCodes?: string[];
  isEnabled: boolean;
  verifiedAt?: string;
}

export interface VerificationToken {
  token: string;
  type: 'email' | 'phone' | 'password_reset';
  userId: string;
  expiresAt: string;
  usedAt?: string;
}

