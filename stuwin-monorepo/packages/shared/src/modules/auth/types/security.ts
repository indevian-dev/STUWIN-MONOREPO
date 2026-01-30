// ═══════════════════════════════════════════════════════════════
// SECURITY TYPES
// ═══════════════════════════════════════════════════════════════
// Types for security events, CSRF protection, and rate limiting

// ═══════════════════════════════════════════════════════════════
// SECURITY LOGS
// ═══════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════
// CSRF PROTECTION
// ═══════════════════════════════════════════════════════════════

export interface CsrfToken {
  token: string;
  expiresAt: string;
  sessionId: string;
  usedTokens: string[]; // to prevent replay attacks
}

// ═══════════════════════════════════════════════════════════════
// RATE LIMITING
// ═══════════════════════════════════════════════════════════════

export interface RateLimitRule {
  key: string; // e.g., 'login_attempts', 'api_calls'
  windowMs: number;
  maxRequests: number;
  blockDurationMs?: number; // how long to block after exceeding limit
}

export interface RateLimitStatus {
  key: string;
  current: number;
  limit: number;
  resetTime: number;
  isBlocked: boolean;
  blockExpiresAt?: number;
}

