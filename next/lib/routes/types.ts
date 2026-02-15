// ═══════════════════════════════════════════════════════════════
// API ENDPOINT CONFIGURATION TYPES
// ═══════════════════════════════════════════════════════════════

import type { NextRequest } from 'next/server';
import type { AuthContext } from '@/lib/domain/base/types';

export interface EndpointConfig {
    path?: string;
    method: string | string[];
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
    checkSubscriptionStatus?: boolean;
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
    windowMs: number;
    maxRequests: number;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
}

// ═══════════════════════════════════════════════════════════════
// WEBHOOK TYPES
// ═══════════════════════════════════════════════════════════════

export interface WebhookEvent<TData = unknown> {
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

// ═══════════════════════════════════════════════════════════════
// HANDLER TYPES
// ═══════════════════════════════════════════════════════════════

/**
 * Minimal logger interface for route handlers.
 * Matches the subset of Logger methods that routes actually call.
 */
export interface HandlerLogger {
    info(message: string, meta?: Record<string, unknown>): void;
    warn(message: string, meta?: Record<string, unknown>): void;
    error(message: string, metaOrError?: unknown, metadata?: Record<string, unknown>): void;
    debug(message: string, meta?: Record<string, unknown>): void;
    http(message: string, meta?: Record<string, unknown>): void;
    apiComplete(opts: {
        statusCode: number;
        duration: number;
        success?: boolean;
        metadata?: Record<string, unknown>;
    }): void;
}

export type ApiRouteHandler = (
    req: NextRequest,
    context: ApiHandlerContext
) => Promise<Response> | Response;


export interface ApiHandlerOptions {
    collectLogs?: boolean;
    collectActionLogs?: boolean;
    [key: string]: unknown;
}

export interface AuthValidationData {
    user: {
        id: string;
        email?: string;
        phone?: string;
        firstName?: string;
        lastName?: string;
        emailVerified?: boolean;
        phoneVerified?: boolean;
    };
    account: {
        id: string;
        role?: string;
        permissions?: string[];
        workspaceId?: string;
        workspaceType?: string;
        subscriptionTier?: string;
        subscribedUntil?: number;
    };
    session: {
        id: string;
        userId: string;
        accountId: string;
        createdAt: string;
        lastActivityAt: string;
    };
}

/**
 * Low-level handler context constructed by withApiHandler.
 * `ctx` and `log` are always set (never undefined at runtime).
 * `authData` is undefined for unauthenticated/public routes.
 */
export interface ApiHandlerContext {
    params: Record<string, string>;
    authData?: AuthValidationData;
    ctx: AuthContext;
    log: HandlerLogger;
    requestId: string;
}
