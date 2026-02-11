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
  preventReuse: number;
  expiryDays?: number;
}

export interface PasswordValidationResult {
  isValid: boolean;
  isPasswordValid: boolean;
  validatedPassword: string | null;
  errors: string[];
  score: number;
}

export interface HashPasswordResult {
  hashedPassword: string;
}

export interface VerifyPasswordResult {
  isPasswordValid: boolean;
}
