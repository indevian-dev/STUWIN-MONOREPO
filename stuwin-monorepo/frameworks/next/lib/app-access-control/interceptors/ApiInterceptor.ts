import { NextRequest, NextResponse } from "next/server";
import { type ApiHandlerContext, ApiRouteHandler, ApiHandlerOptions } from "@/types/next";
import { ModuleFactory } from "@/lib/app-core-modules/factory";
import { AuthContext } from "@/lib/app-core-modules/types";

// Imports from ApisCoreAuthorizer
import { allEndpoints } from '@/lib/app-route-configs';
import { ResponseResponder } from '@/lib/app-access-control/responders/ResponseResponder';
import { RouteValidator } from '@/lib/app-access-control/validators/RouteValidator';
import { CoreAuthorizer } from '@/lib/app-access-control/authorizers/CoreAuthorizer';
import { SessionAuthenticator } from '@/lib/app-access-control/authenticators/SessionAuthenticator';
import { CookieAuthenticator } from '@/lib/app-access-control/authenticators/CookieAuthenticator';
import { db } from "@/lib/app-infrastructure/database";
import { isValidSlimId } from "@/lib/utils/slimUlidUtility";
import logger, {
    createRequestTimer,
    generateRequestId
} from '@/lib/app-infrastructure/loggers/Logger';
import { logAccountAction } from '@/lib/app-infrastructure/loggers/ActionLogger';
import { mapValidationToResponse } from "./ApiErrorMapper";
import type { ApiValidationResult, AuthData } from '@/types';
import type { GetUserDataResult } from '@/lib/app-access-control/authenticators/IdentityAuthenticator';


// ═══════════════════════════════════════════════════════════════
// BASE API HANDLER (Infrastructure & Security)
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// BASE API HANDLER (Infrastructure & Security)
// ═══════════════════════════════════════════════════════════════

// Helper to centralize API error handling
function handleApiError(
    error: any,
    context: {
        request: NextRequest;
        log: any; // Logger instance
        requestId: string;
        getElapsed: () => number;
        normalizedPath: string;
        accountId?: string;
    }
): NextResponse {
    const { log, request, normalizedPath, accountId, getElapsed, requestId } = context;

    // 1. Log the error structurally
    log.error('API Error', error, {
        path: normalizedPath,
        method: request.method,
        accountId,
    });

    // 2. Dev-only console fallback for immediate visibility
    if (process.env.NODE_ENV === 'development') {
        console.error(`[API ERROR] ${request.method} ${normalizedPath}:`, error);
    }

    // 3. Log completion metric
    log.apiComplete({
        statusCode: 500,
        duration: getElapsed(),
        success: false,
        metadata: { accountId }
    });

    // 4. Return robust error response
    return addRequestIdHeader(
        ResponseResponder.createInternalServerErrorApiResponse(),
        requestId
    );
}

export function withApiHandler(
    handler: ApiRouteHandler,
    options: ApiHandlerOptions = {}
) {
    return async (request: NextRequest, context: Record<string, any> = {}) => {
        // Initialize request timer and logger
        const getElapsed = createRequestTimer();
        const requestId = request.headers.get('x-request-id') || generateRequestId();
        const log = logger.forRequest(request, { requestId });

        let normalizedPath = request.nextUrl?.pathname || '';
        let accountId: string | undefined;

        try {
            // ═══════════════════════════════════════════════════════════════
            // 1. VALIDATION & ROUTING
            // ═══════════════════════════════════════════════════════════════
            const validationConfig = RouteValidator.validateEndpoint(request, allEndpoints);
            normalizedPath = validationConfig.normalizedPath || normalizedPath;

            if (!validationConfig.isValid || !validationConfig.endpoint) {
                log.warn('Endpoint configuration not found', { path: normalizedPath });
                return addRequestIdHeader(
                    NextResponse.json({ error: 'Not Found' }, { status: 404 }),
                    requestId
                );
            }

            const endpointConfig = validationConfig.endpoint;
            log.http(`${request.method} ${normalizedPath}`);

            // ═══════════════════════════════════════════════════════════════
            // 2. AUTHORIZATION & CONTEXT
            // ═══════════════════════════════════════════════════════════════

            // Resolve params early
            const resolvedParams = await context.params;

            // Perform Authorization
            const authResult = await CoreAuthorizer.validateEndpointRequest({
                endpointConfig,
                workspaceId: resolvedParams?.workspaceId
            });

            // Handle optional auth or failure
            if (!authResult.isValid) {
                // If auth is optional and failed, we might still proceed as guest... 
                // BUT CoreAuthorizer usually handles that logic. 
                // However, for strictly "public but try auth" (authOptional), CoreAuthorizer returns valid=true usually?
                // Let's rely on isValid. If it's NOT valid, it means it failed requirements.

                // Special check: public endpoints with no auth requirement shouldn't fail even if token is bad?
                // Actually CoreAuthorizer handles that. If auth not required, it returns success.

                log.warn('Authorization failed', {
                    path: normalizedPath,
                    code: authResult.code
                });

                const response = mapValidationToResponse(authResult);
                log.apiComplete({
                    statusCode: response.status,
                    duration: getElapsed(),
                    success: false
                });
                return addRequestIdHeader(response, requestId);
            }

            // Authorization Success
            accountId = authResult.accountId;
            if (accountId) {
                log.debug('Request authorized', { accountId });
            }

            // Prepare Context
            const authContext = authResult.ctx || {
                userId: "guest",
                accountId: "0",
                permissions: [],
                allowedWorkspaceIds: [],
                activeWorkspaceId: undefined
            };

            const handlerContext: ApiHandlerContext = {
                ...context,
                authData: authResult.authData || undefined,
                ctx: authContext,
                endpointConfig,
                requestId,
                log,
                db,
                isValidSlimId,
                params: resolvedParams
            } as any;

            // ═══════════════════════════════════════════════════════════════
            // 3. EXECUTION
            // ═══════════════════════════════════════════════════════════════

            const response = await handler(request, handlerContext);

            // ═══════════════════════════════════════════════════════════════
            // 4. POST-PROCESSING (Logging & Cookies)
            // ═══════════════════════════════════════════════════════════════

            // Wrapper-level Action Logging (if enabled)
            if (endpointConfig?.collectActionLogs && authResult.authData) {
                // Fire and forget logging
                logAccountAction(request, authResult.authData, {
                    statusCode: response.status
                }).catch(err => log.warn('Action logging failed', { error: err.message }));
            }

            // Session Rollover
            if (authResult.needsRefresh && authResult.authData?.session?.id) {
                const newExpireAt = await SessionAuthenticator.rolloverSession(authResult.authData.session.id);
                if (newExpireAt) {
                    CookieAuthenticator.setAuthCookies({
                        response,
                        data: {
                            session: request.cookies.get('session')?.value,
                            expireAt: newExpireAt
                        }
                    });
                }
            }

            // Completion Log
            if (endpointConfig?.collectLogs !== false) {
                log.apiComplete({
                    statusCode: response.status,
                    duration: getElapsed(),
                    metadata: { accountId }
                });
            }

            return addRequestIdHeader(response, requestId);

        } catch (error: any) {
            return handleApiError(error, {
                request,
                log,
                requestId,
                getElapsed,
                normalizedPath,
                accountId
            });
        }
    };
}


// ═══════════════════════════════════════════════════════════════
// UNIFIED HANDLER (Service Layer Injection)
// ═══════════════════════════════════════════════════════════════

// Extended context with ModuleFactory
export type UnifiedContext = ApiHandlerContext & {
    module: ModuleFactory;
    auth: AuthContext;
    db: typeof db;
    isValidSlimId: typeof isValidSlimId;
    log: any;
};

// Handler type using UnifiedContext
export type UnifiedApiHandler = (
    req: NextRequest,
    ctx: UnifiedContext
) => Promise<NextResponse>;

/**
 * Validates request and injects ModuleFactory
 */
export function unifiedApiHandler(handler: UnifiedApiHandler, options?: ApiHandlerOptions) {
    return withApiHandler(async (req, ctx) => {
        const authContext = ctx.ctx || {
            userId: "guest",
            accountId: "0",
            permissions: [],
            allowedWorkspaceIds: [],
            activeWorkspaceId: undefined
        };
        const module = new ModuleFactory(authContext);

        return handler(req, {
            ...ctx,
            module,
            auth: authContext
        });
    }, options);
}


// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Add request ID header to response for correlation
 */
function addRequestIdHeader(response: Response, requestId: string): NextResponse {
    if (response instanceof NextResponse) {
        response.headers.set('X-Request-Id', requestId);
        return response;
    }

    const newResponse = new NextResponse(response.body, response);
    newResponse.headers.set('X-Request-Id', requestId);
    return newResponse;
}

