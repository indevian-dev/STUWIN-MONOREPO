
import React from "react";
import { redirect } from "next/navigation";
import { allEndpoints } from "@/lib/app-route-configs";
import { RouteValidator } from "@/lib/app-access-control/validators/RouteValidator";
import { CoreAuthorizer } from "@/lib/app-access-control/authorizers/CoreAuthorizer";
import GlobalInlineForbiddenWidget from "@/app/[locale]/(global)/(widgets)/GlobalInlineForbiddenWidget";
import { ConsoleLogger } from "@/lib/app-infrastructure/loggers/ConsoleLogger";
import { ModuleFactory } from "@/lib/app-core-modules/factory";
import { AuthContext } from "@/lib/app-core-modules/types";
import type { EndpointConfig } from "@/types";
import type { GetUserDataResult } from "@/lib/app-access-control/authenticators/IdentityAuthenticator";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface UIConfigInfo {
    config: EndpointConfig | undefined;
    normalizedPath: string;
}

export interface UIAuthOptions {
    path: string;
    requiredPermissions?: string[] | null;
    loginRedirect?: string;
    forbiddenRedirect?: string;
    inlineHandlers?: boolean;
    isPublic?: boolean;
}

export interface UIHandlerContext {
    authData: GetUserDataResult | null;
    module: ModuleFactory;
    auth: AuthContext;
    path: string;
}

// ═══════════════════════════════════════════════════════════════
// CONFIG HELPERS
// ═══════════════════════════════════════════════════════════════

function getEndpointConfig(pathname: string): UIConfigInfo {
    // Consolidate all endpoints for validation
    // allEndpoints is imported from index.ts

    const validation = RouteValidator.validateEndpoint({ nextUrl: { pathname } } as any, allEndpoints);
    const normalizedPath = validation.normalizedPath || pathname;

    if (!validation.isValid || !validation.endpoint) {
        return {
            config: undefined,
            normalizedPath
        };
    }

    return {
        config: validation.endpoint,
        normalizedPath
    };
}

function createAuthContext(authData: any): AuthContext {
    if (authData) {
        return {
            userId: authData.user.id,
            accountId: typeof authData.account.id === 'string' ? authData.account.id : String(authData.account.id),
            permissions: authData.permissions || [],
            allowedWorkspaceIds: authData.allowedWorkspaceIds || [],
            activeWorkspaceId: authData.workspace?.id
        };
    }
    return {
        userId: "guest",
        accountId: "0",
        allowedWorkspaceIds: []
    };
}

// ═══════════════════════════════════════════════════════════════
// UNIFIED PAGE/LAYOUT WRAPPER
// ═══════════════════════════════════════════════════════════════

/**
 * Higher-order wrapper for protected Server Components (Pages and Layouts)
 */
export function withUiAuth<P extends any>(
    Component: (props: P & UIHandlerContext) => React.ReactElement | Promise<React.ReactElement>,
    options: UIAuthOptions
) {
    const {
        path: explicitPath,
        requiredPermissions = null,
        loginRedirect = "/auth/login",
        forbiddenRedirect = "/forbidden",
        inlineHandlers = false,
        isPublic = false,
    } = options;

    if (!explicitPath) {
        throw new Error("withUiAuth requires 'path' option for security.");
    }

    const WrappedComponent = async function ProtectedUIComponent(props: P) {
        // Extract locale from params (standard Next.js pattern)
        const resolvedParams = await (props as any).params;
        const locale = resolvedParams?.locale || "az";

        // 1. Handle Public Access
        if (isPublic) {
            const authContext = createAuthContext(null);
            const module = new ModuleFactory(authContext);
            return <Component {...(props as any)} authData={null} module={module} auth={authContext} path={explicitPath} />;
        }

        // 2. Resolve Config
        const { config, normalizedPath } = getEndpointConfig(explicitPath);
        ConsoleLogger.log(`🔐 UI access: ${normalizedPath} [${locale}]`);

        // 3. Determine required permissions
        const permissions = requiredPermissions || (config?.permission ? [config.permission] : []);
        const authRequired = config?.authRequired ?? true;

        if (!authRequired && permissions.length === 0) {
            const authContext = createAuthContext(null);
            const module = new ModuleFactory(authContext);
            return <Component {...(props as any)} authData={null} module={module} auth={authContext} path={normalizedPath} />;
        }

        // 4. Validate access
        const workspaceId = resolvedParams?.workspaceId;
        const authResult = await CoreAuthorizer.validateEndpointRequest({
            endpointConfig: config,
            requiredPermissions: permissions,
            workspaceId
        });

        const { isValid, code, authData, accountId, needsRefresh } = authResult;


        // 6. Handle Failures
        if (!isValid) {
            ConsoleLogger.log(`⛔ UI Auth failed: ${code}`);

            switch (code) {
                case "UNAUTHORIZED":
                    redirect(`/${locale}${loginRedirect}?redirect=${encodeURIComponent(normalizedPath)}`);
                    break;
                case "ACCOUNT_SUSPENDED":
                    redirect(`/${locale}/auth/suspended`);
                    break;
                case "EMAIL_NOT_VERIFIED":
                case "VERIFY_EMAIL_REQUIRED":
                    // Prevent infinite redirect if already on verification page
                    if (normalizedPath.startsWith('/auth/verify')) {
                        break; // Proceed to render the page (it allows user to verify)
                    }
                    redirect(`/${locale}/auth/verify?type=email&redirect=${encodeURIComponent(normalizedPath)}`);
                    break;
                case "PHONE_NOT_VERIFIED":
                case "VERIFY_PHONE_REQUIRED":
                    // Prevent infinite redirect if already on verification page
                    if (normalizedPath.startsWith('/auth/verify')) {
                        break;
                    }
                    redirect(`/${locale}/auth/verify?type=phone&redirect=${encodeURIComponent(normalizedPath)}`);
                    break;
                case "PERMISSION_DENIED":
                case "WORKSPACE_MISMATCH":
                default:
                    if (inlineHandlers) return <GlobalInlineForbiddenWidget returnUrl={normalizedPath} />;
                    redirect(`/${locale}${forbiddenRedirect}`);
            }
        }

        // 7. Success - Create Service Context
        ConsoleLogger.log(`✓ UI access granted: ${normalizedPath} for account ${accountId}`);

        const authContext = createAuthContext(authData);
        const module = new ModuleFactory(authContext);

        return <Component
            {...(props as any)}
            authData={authData as GetUserDataResult}
            module={module}
            auth={authContext}
            path={normalizedPath}
        />;
    };

    return WrappedComponent;
}

// ═══════════════════════════════════════════════════════════════
// ALIASES
// ═══════════════════════════════════════════════════════════════

export const withPageAuth = withUiAuth;
export const withLayoutAuth = withUiAuth;
