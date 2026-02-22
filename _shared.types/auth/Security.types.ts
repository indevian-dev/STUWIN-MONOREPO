// Security Events

export interface SecurityEvent {
  id: string;
  userId?: string;
  accountId?: number;
  type: 'login' | 'logout' | 'failed_login' | 'password_change' | 'email_change' | 'suspension';
  ip: string;
  userAgent: string;
  location?: string;
  success: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
}

// CSRF Protection

export interface CsrfToken {
  token: string;
  expiresAt: string;
  sessionId: string;
  usedTokens: string[];
}

// Rate Limiting

export interface RateLimitRule {
  key: string;
  windowMs: number;
  maxRequests: number;
  blockDurationMs?: number;
}

export interface RateLimitStatus {
  key: string;
  current: number;
  limit: number;
  resetTime: number;
  isBlocked: boolean;
  blockExpiresAt?: number;
}
