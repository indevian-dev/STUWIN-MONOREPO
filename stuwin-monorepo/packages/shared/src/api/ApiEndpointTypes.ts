// ═══════════════════════════════════════════════════════════════
// API ENDPOINT CONFIGURATION TYPES
// ═══════════════════════════════════════════════════════════════
// Types for defining and configuring API endpoints

export interface EndpointConfig {
  path?: string;
  method: string;
  authRequired: boolean;
  permission?: string;
  requiresTwoFactor?: boolean;
  needEmailVerification?: boolean;
  needPhoneVerification?: boolean;
  rateLimit?: {
    windowMs: number;
    maxRequests: number;
  };
  workspace?: string;
  type?: 'page' | 'api';
  twoFactorAuth?: boolean;
  twoFactorAuthType?: string;
  collectActionLogs?: boolean;
  collectLogs?: boolean;
  queryDataAuthenticated?: boolean;
  [key: string]: any;
}



export interface RouteValidation {
  isValid: boolean;
  endpoint: EndpointConfig | undefined;
  normalizedPath: string | undefined;
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

