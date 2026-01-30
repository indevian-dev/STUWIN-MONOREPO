// ═══════════════════════════════════════════════════════════════
// API ENDPOINT CONFIGURATION TYPES
// ═══════════════════════════════════════════════════════════════
// Types for defining and configuring API endpoints

export interface EndpointConfig {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  authRequired: boolean;
  permission?: string;
  requiresTwoFactor?: boolean;
  needEmailVerification?: boolean;        // Require email to be verified
  needPhoneVerification?: boolean;        // Require phone to be verified
  rateLimit?: {
    windowMs: number;
    maxRequests: number;
  };
}

export interface ApiEndpointGroup {
  [key: string]: EndpointConfig;
}

export type EndpointsMap = Record<string, EndpointConfig>;

// ═══════════════════════════════════════════════════════════════
// RATE LIMIT TYPES
// ═══════════════════════════════════════════════════════════════

export interface RateLimitInfo {
  remaining: number;
  resetTime: number;
  total: number;
}

export interface RateLimitConfig {
  windowMs: number; // time window in milliseconds
  maxRequests: number; // max requests per window
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

// ═══════════════════════════════════════════════════════════════
// WEBHOOK TYPES
// ═══════════════════════════════════════════════════════════════

export interface WebhookEvent<TData = any> {
  id: string;
  type: string;
  data: TData;
  createdAt: string;
  signature?: string;
}

export interface WebhookConfig {
  url: string;
  secret: string;
  events: string[];
  isActive: boolean;
}

