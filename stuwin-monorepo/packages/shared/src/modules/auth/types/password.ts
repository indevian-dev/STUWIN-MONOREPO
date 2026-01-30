// ═══════════════════════════════════════════════════════════════
// PASSWORD MANAGEMENT TYPES
// ═══════════════════════════════════════════════════════════════
// Types for password handling, validation, and reset

export interface PasswordResetRequest {
  id: string;
  userId: string;
  email: string;
  token: string;
  expiresAt: string;
  usedAt?: string;
  createdAt: string;
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSymbols: boolean;
  preventReuse: number; // number of previous passwords to prevent
  expiryDays?: number;
}

export interface PasswordValidationResult {
  isValid: boolean;
  isPasswordValid: boolean;
  validatedPassword: string | null;
  errors: string[];
  score: number; // 0-100 strength score
}

export interface HashPasswordResult {
  hashedPassword: string;
}

export interface VerifyPasswordResult {
  isPasswordValid: boolean;
}

