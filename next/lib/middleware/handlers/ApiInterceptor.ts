import { NextRequest, NextResponse } from "next/server";
import { type ApiHandlerContext, type ApiRouteHandler, type ApiHandlerOptions, type AuthValidationData } from "@/lib/routes/types";
import { ModuleFactory } from "@/lib/domain/factory";
import { AuthContext } from "@/lib/domain/base/types";

// Imports from ApisCoreAuthorizer
import { allEndpoints } from '@/lib/routes';
import { ResponseResponder } from '@/lib/middleware/responses/ResponseResponder';
import { RouteValidator } from '@/lib/middleware/validators/RouteValidator';
import { CoreAuthorizer } from '@/lib/middleware/authorizers/CoreAuthorizer';
import { SessionStore } from '@/lib/middleware/authenticators/SessionStore';
import { db } from "@/lib/database";
import { isValidSlimId } from "@/lib/utils/ids/SlimUlidUtil";
import logger, {
    createRequestTimer,
    generateRequestId
} from '@/lib/logging/Logger';
type LoggerInstance = typeof logger;
import { logAccountAction } from '@/lib/logging/ActionLogger';
import { mapValidationToResponse } from "./ApiErrorMapper";



// ═══════════════════════════════════════════════════════════════
// BASE API HANDLER (Infrastructure & Security)
// ═══════════════════════════════════════════════════════════════

// Helper to centralize API error handling
function handleApiError(
    error: unknown,
    context: {
        request: NextRequest;
        log: LoggerInstance;
        requestId: string;
        getElapsed: () => number;
        normalizedPath: string;
        accountId?: string;
    }
): NextResponse {
    const { log, request, normalizedPath, accountId, getElapsed, requestId } = context;

    // 1. Log the error structurally
    log.error('API Error', error instanceof Error ? error : new Error(String(error)), {
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
    _options: ApiHandlerOptions = {}
) {
    return async (request: NextRequest, context: { params: Promise<Record<string, string>> } = { params: Promise.resolve({}) }) => {
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
                activeWorkspaceId: undefined
            };

            const handlerContext: ApiHandlerContext = {
                params: resolvedParams,
                authData: authResult.authData ?? undefined,
                ctx: authContext,
                log,
                requestId,
            };

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
                }).catch((err: Error) => log.warn('Action logging failed', { error: err.message }));
            }

            // Session TTL Refresh
            if (authResult.needsRefresh && authResult.ctx?.accountId) {
                const sessionId = request.cookies.get('session')?.value;
                if (sessionId) {
                    // Fire and forget — just extend the Redis TTL
                    SessionStore.refresh(sessionId).catch((err: Error) =>
                        log.warn('Session refresh failed', { error: err.message })
                    );
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

        } catch (error: unknown) {
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

/**
 * Extended context with guaranteed types for route handlers.
 * All fields are non-optional — withApiHandler guarantees ctx/log,
 * and unifiedApiHandler guarantees auth/module/authData.
 */
export type UnifiedContext = {
    params: Record<string, string>;
    authData: AuthValidationData;
    ctx: AuthContext;                   // backward-compat alias for auth
    auth: AuthContext;                  // primary field name
    module: ModuleFactory;
    log: LoggerInstance;
    db: typeof db;
    isValidSlimId: typeof isValidSlimId;
    requestId: string;
};

// Handler type using UnifiedContext
export type UnifiedApiHandler = (
    req: NextRequest,
    ctx: UnifiedContext
) => Promise<NextResponse>;

/**
 * Validates request and injects ModuleFactory.
 * Guarantees auth/module/log/authData are non-optional.
 */
export function unifiedApiHandler(handler: UnifiedApiHandler, options?: ApiHandlerOptions) {
    return withApiHandler(async (req, ctx) => {
        // ctx.ctx is always set by withApiHandler (guest fallback)
        const authContext = ctx.ctx;
        const services = new ModuleFactory(authContext);

        // Build guaranteed-shape authData (empty defaults for public routes)
        const authData: AuthValidationData = ctx.authData ?? {
            user: { id: authContext.userId },
            account: { id: authContext.accountId ?? '0' },
            session: { id: '', userId: authContext.userId, accountId: authContext.accountId ?? '0', createdAt: '', lastActivityAt: '' },
        };

        return handler(req, {
            params: ctx.params,
            authData,
            ctx: authContext,
            auth: authContext,
            module: services,
            log: ctx.log as LoggerInstance,
            db,
            isValidSlimId,
            requestId: ctx.requestId,
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
