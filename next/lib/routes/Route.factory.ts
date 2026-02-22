import type { RouteConfig } from '@/lib/routes/Route.types';

/**
 * Creates an endpoint configuration factory for a specific workspace
 */
export const createRouteFactory = (defaults: {
  workspace: 'student' | 'staff' | 'provider' | 'parent' | undefined;
  verifyOwnership?: boolean;
  needEmailVerification?: boolean;
  needPhoneVerification?: boolean;
}) => {
  return (config: RouteConfig): RouteConfig => ({
    method: config.method,
    authRequired: config.authRequired,
    permission: config.permission,
    needEmailVerification: config.needEmailVerification ?? defaults.needEmailVerification ?? false,
    needPhoneVerification: config.needPhoneVerification ?? defaults.needPhoneVerification ?? false,
    twoFactorAuth: config.twoFactorAuth ?? false,
    twoFactorAuthType: config.twoFactorAuthType,
    workspace: config.workspace ?? defaults.workspace,
    type: config.type,
    collectActionLogs: config.collectActionLogs ?? false,
    collectLogs: config.collectLogs ?? false,
    queryDataAuthenticated: config.queryDataAuthenticated ?? false,
    checkSubscriptionStatus: config.checkSubscriptionStatus ?? false,

  });
};

/**
 * Generic endpoint factory - create endpoints with custom workspace configuration
 */
export const createRoute = createRouteFactory({
  workspace: undefined,
});
