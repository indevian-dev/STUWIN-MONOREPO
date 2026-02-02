import type { EndpointConfig } from '@/types';

/**
 * Common endpoint configuration options
 */
export interface EndpointConfigOptions {
  method: string;
  authRequired: boolean;
  permission?: string;
  needEmailVerification?: boolean;
  needPhoneVerification?: boolean;
  twoFactorAuth?: boolean;
  twoFactorAuthType?: string;
  workspace?: 'student' | 'staff' | 'provider' | 'parent' | 'tutor' | undefined;
  type: "page" | "api";
  collectActionLogs?: boolean;
  collectLogs?: boolean;
  queryDataAuthenticated?: boolean; // 🔒 Require all query values come from authData
  checkSubscriptionStatus?: boolean; // 🔒 Require valid subscription
}

/**
 * Creates an endpoint configuration factory for a specific workspace
 */
export const createRouteFactory = (defaults: {
  workspace: 'student' | 'staff' | 'provider' | 'parent' | undefined;
  verifyOwnership?: boolean;
  needEmailVerification?: boolean;
  needPhoneVerification?: boolean;
}) => {
  return (config: EndpointConfigOptions): EndpointConfig & Record<string, any> => ({
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
export const createEndpoint = createRouteFactory({
  workspace: undefined,
});
