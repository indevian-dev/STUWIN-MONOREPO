import { CookieAuthenticator } from '@/lib/middleware/Authenticator.Cookie.middleware';
import { SessionStore, type ResolvedSession } from '@/lib/middleware/Store.Session.middleware';
import logger from '@/lib/logging/Request.logger';
import type { RouteConfig } from '@/lib/routes/Route.types';
import type { AuthContext, AuthUser, AuthAccount, AuthSession } from '@stuwin/shared/types/auth/AuthData.types';
import { ConsoleLogger } from '@/lib/logging/Console.logger';
import redis from '@/lib/integrations/upstash/RedisSession.client';

// ═══════════════════════════════════════════════════════════════
// AUTH DATA — Server-only full identity (composed from shared blocks)
// ═══════════════════════════════════════════════════════════════

export interface AuthData {
  user: AuthUser;
  account: AuthAccount;
  session: AuthSession;
}

// ═══════════════════════════════════════════════════════════════
// API VALIDATION RESULT
// ═══════════════════════════════════════════════════════════════

export interface ApiValidationResult {
  isValid: boolean;
  code?: string;
  authData?: AuthData;
  ctx?: AuthContext;
  accountId?: string;
  userId?: string;
  needsRefresh?: boolean;
  step: string;
}

// ═══════════════════════════════════════════════════════════════
// TYPES & CONSTANTS
// ═══════════════════════════════════════════════════════════════

type ValidationCode =
  | 'UNAUTHORIZED'
  | 'ACCOUNT_SUSPENDED'
  | 'EMAIL_NOT_VERIFIED' | 'PHONE_NOT_VERIFIED'
  | 'PERMISSION_DENIED' | 'WORKSPACE_MISMATCH'
  | '2FA_EMAIL_REQUIRED' | '2FA_PHONE_REQUIRED' | '2FA_TYPE_UNKNOWN'
  | 'VERIFY_EMAIL_REQUIRED' | 'VERIFY_PHONE_REQUIRED'
  | 'SUBSCRIPTION_REQUIRED';

type ValidationStep = 'tokens' | 'token' | 'status' | 'workspace' | 'permission' | '2fa' | 'complete';

interface ValidationContext {
  session: string | undefined;
  endpointConfig?: RouteConfig;
  requiredPermissions: string[];
  resolved?: ResolvedSession;
  accountId?: string;
  userId?: string;
  workspaceId?: string;
}

interface StepResult {
  success: boolean;
  code?: ValidationCode;
  resolved?: ResolvedSession;
  accountId?: string;
  userId?: string;
  needsRefresh?: boolean;
}

// ═══════════════════════════════════════════════════════════════
// VALIDATION HELPERS
// ═══════════════════════════════════════════════════════════════

function checkAccountStatus(
  resolved: ResolvedSession | undefined,
  needEmailVerification: boolean | undefined,
  needPhoneVerification: boolean | undefined
): StepResult {
  if (!resolved) {
    return { success: false, code: 'UNAUTHORIZED' };
  }

  if (needEmailVerification && !resolved.emailVerified) {
    return { success: false, code: 'EMAIL_NOT_VERIFIED' };
  }

  if (needPhoneVerification && !resolved.phoneVerified) {
    return { success: false, code: 'PHONE_NOT_VERIFIED' };
  }

  return { success: true };
}

function hasPermission(resolved: ResolvedSession | undefined, permission: string): boolean {
  if (!resolved) return false;

  // Check if permission is granted by role
  if (resolved.permissions?.includes(permission)) {
    return true;
  }

  // Automatically grant provider permissions to provider workspace context
  if (permission.startsWith('PROVIDER_') && resolved.workspaceType === 'provider') {
    return true;
  }

  // Automatically grant staff permissions to staff workspace context
  if (permission.startsWith('STAFF_') && resolved.workspaceType === 'staff') {
    return true;
  }

  // Automatically grant student permissions to student workspace context
  if (permission.startsWith('STUDENT_') && resolved.workspaceType === 'student') {
    return true;
  }

  return false;
}

// ═══════════════════════════════════════════════════════════════
// VALIDATION STEPS (composable validators)
// ═══════════════════════════════════════════════════════════════

class ValidationSteps {

  static async validateSession(ctx: ValidationContext): Promise<StepResult> {
    if (!ctx.session) {
      if (ctx.endpointConfig?.authRequired === false) {
        return { success: true };
      }

      logger.error('No session ID provided');
      return { success: false, code: 'UNAUTHORIZED' };
    }

    // Use SessionStore.resolve() — 2 Redis calls on cache hit, 0 DB queries
    // Pass workspace type from endpoint config to filter correct access record
    const resolved = await SessionStore.resolve(ctx.session, ctx.workspaceId, ctx.endpointConfig?.workspace);

    if (!resolved) {
      if (ctx.endpointConfig?.authRequired === false) {
        return { success: true };
      }

      logger.error('Session invalid or expired');
      return { success: false, code: 'UNAUTHORIZED' };
    }

    logger.debug('Session resolved from cache', { accountId: resolved.accountId });

    return {
      success: true,
      resolved,
      accountId: resolved.accountId,
      userId: resolved.userId,
    };
  }

  static validateStatus(ctx: ValidationContext): StepResult {
    ConsoleLogger.log('Validating account status', {
      hasEndpointConfig: !!ctx.endpointConfig,
      needEmailVerification: ctx.endpointConfig?.needEmailVerification,
      needPhoneVerification: ctx.endpointConfig?.needPhoneVerification
    });

    // If guest (no resolved data) and auth optional, skip status checks
    if (!ctx.resolved && ctx.endpointConfig?.authRequired === false) {
      return { success: true };
    }

    const result = checkAccountStatus(
      ctx.resolved,
      ctx.endpointConfig?.needEmailVerification,
      ctx.endpointConfig?.needPhoneVerification
    );

    if (!result.success && result.code) {
      logger.warn(`Account status check failed: ${result.code}`);
    }

    return result;
  }

  static validateEmailVerification(ctx: ValidationContext): StepResult {
    if (!ctx.endpointConfig?.needEmailVerification) {
      return { success: true };
    }

    if (!ctx.resolved?.emailVerified) {
      logger.warn('Email verification required but not verified');
      return { success: false, code: 'EMAIL_NOT_VERIFIED' };
    }

    logger.debug('Email verification validated');
    return { success: true };
  }

  static validatePhoneVerification(ctx: ValidationContext): StepResult {
    if (!ctx.endpointConfig?.needPhoneVerification) {
      return { success: true };
    }

    if (!ctx.resolved?.phoneVerified) {
      logger.warn('Phone verification required but not verified');
      return { success: false, code: 'PHONE_NOT_VERIFIED' };
    }

    logger.debug('Phone verification validated');
    return { success: true };
  }

  static validateWorkspace(ctx: ValidationContext): StepResult {
    const endpointWorkspace = ctx.endpointConfig?.workspace;
    const accountWorkspace = ctx.resolved?.workspaceType;

    if (endpointWorkspace && accountWorkspace && endpointWorkspace !== accountWorkspace) {
      logger.warn('Workspace mismatch', {
        endpointWorkspace,
        accountWorkspace,
        accountId: ctx.accountId
      });
      return { success: false, code: 'WORKSPACE_MISMATCH' };
    }

    if (endpointWorkspace) {
      logger.debug('Workspace validated', { endpointWorkspace });
    }

    return { success: true };
  }

  static validatePermissions(ctx: ValidationContext): StepResult {
    const configPermission = ctx.endpointConfig?.permission;

    // Check endpoint config permission
    if (configPermission && !hasPermission(ctx.resolved, configPermission)) {
      logger.warn('Permission denied', { permission: configPermission });
      return { success: false, code: 'PERMISSION_DENIED' };
    }

    // Check required permissions array
    for (const permission of ctx.requiredPermissions) {
      if (!hasPermission(ctx.resolved, permission)) {
        logger.warn('Permission denied', { permission });
        return { success: false, code: 'PERMISSION_DENIED' };
      }
    }

    if (ctx.requiredPermissions.length > 0) {
      logger.debug('Permissions validated', { permissions: ctx.requiredPermissions });
    }

    if (configPermission) {
      logger.debug('Permission validated', { permission: configPermission });
    }

    return { success: true };
  }

  static validateSubscription(ctx: ValidationContext): StepResult {
    const config = ctx.endpointConfig;
    if (!config?.checkSubscriptionStatus) {
      return { success: true };
    }

    const resolved = ctx.resolved;
    if (!resolved?.subscribedUntil) {
      logger.warn('Subscription required but not active', { accountId: ctx.accountId });
      return { success: false, code: 'SUBSCRIPTION_REQUIRED' };
    }

    const isSubscribed = resolved.subscribedUntil > Date.now();
    if (!isSubscribed) {
      logger.warn('Subscription expired', { accountId: ctx.accountId });
      return { success: false, code: 'SUBSCRIPTION_REQUIRED' };
    }

    logger.debug('Subscription validated');
    return { success: true };
  }

  /**
   * Validate 2FA requirement.
   * Checks Redis for a `2fa:{sessionId}` key set during OTP verification.
   * TTL on this key controls how long a 2FA verification is valid.
   */
  static async validate2FA(ctx: ValidationContext): Promise<StepResult> {
    const config = ctx.endpointConfig;
    if (!config?.twoFactorAuth) {
      return { success: true };
    }

    const resolved = ctx.resolved;
    if (!resolved?.sessionId) {
      logger.warn('2FA required but no session available');
      return { success: false, code: config.twoFactorAuthType === 'phone' ? '2FA_PHONE_REQUIRED' : '2FA_EMAIL_REQUIRED' };
    }

    // Check Redis for recent 2FA verification
    const twoFAKey = `2fa:${resolved.sessionId}`;
    const twoFAVerified = await redis.get(twoFAKey);

    if (!twoFAVerified) {
      logger.warn('2FA verification required', {
        accountId: ctx.accountId,
        type: config.twoFactorAuthType || 'email'
      });
      return {
        success: false,
        code: config.twoFactorAuthType === 'phone' ? '2FA_PHONE_REQUIRED' : '2FA_EMAIL_REQUIRED'
      };
    }

    logger.debug('2FA validated', { sessionId: resolved.sessionId });
    return { success: true };
  }
}

// ═══════════════════════════════════════════════════════════════
// MAIN AUTHORIZER CLASS
// ═══════════════════════════════════════════════════════════════

export class CoreAuthorizer {

  /**
   * Unified validation for both API routes and Server Components
   */
  static async validateEndpointRequest(params?: {
    endpointConfig?: RouteConfig;
    requiredPermissions?: string[];
    workspaceId?: string;
  }): Promise<ApiValidationResult> {
    const { authCookiesData } = await CookieAuthenticator.getAuthCookies();

    return this._runValidationPipeline({
      session: authCookiesData.session,
      endpointConfig: params?.endpointConfig,
      requiredPermissions: params?.requiredPermissions || [],
      workspaceId: params?.workspaceId
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // VALIDATION PIPELINE
  // ═══════════════════════════════════════════════════════════════

  private static async _runValidationPipeline(
    ctx: ValidationContext
  ): Promise<ApiValidationResult> {

    // Step 1: Validate session & resolve auth data from Redis
    const sessionResult = await ValidationSteps.validateSession(ctx);
    if (!sessionResult.success) {
      return this._createResult('token', sessionResult);
    }

    // Update context with resolved data
    ctx.resolved = sessionResult.resolved;
    ctx.accountId = sessionResult.accountId;
    ctx.userId = sessionResult.userId;

    // Step 2: Validate account status
    const statusResult = ValidationSteps.validateStatus(ctx);
    if (!statusResult.success) {
      return this._createResult('status', statusResult, ctx);
    }

    // Step 3: Validate workspace mismatch
    const workspaceResult = ValidationSteps.validateWorkspace(ctx);
    if (!workspaceResult.success) {
      return this._createResult('workspace', workspaceResult, ctx);
    }

    // Step 4: Validate permissions
    const permResult = ValidationSteps.validatePermissions(ctx);
    if (!permResult.success) {
      return this._createResult('permission', permResult, ctx);
    }

    // Step 5: Validate 2FA (if required by endpoint)
    const twoFAResult = await ValidationSteps.validate2FA(ctx);
    if (!twoFAResult.success) {
      return this._createResult('2fa', twoFAResult, ctx);
    }

    // Step 6: Validate email verification (if required)
    const emailVerifyResult = ValidationSteps.validateEmailVerification(ctx);
    if (!emailVerifyResult.success) {
      return this._createResult('status', emailVerifyResult, ctx);
    }

    // Step 7: Validate phone verification (if required)
    const phoneVerifyResult = ValidationSteps.validatePhoneVerification(ctx);
    if (!phoneVerifyResult.success) {
      return this._createResult('status', phoneVerifyResult, ctx);
    }

    // Step 8: Validate Subscription
    const subResult = ValidationSteps.validateSubscription(ctx);
    if (!subResult.success) {
      return this._createResult('status', subResult, ctx);
    }

    // Success!
    return this._createResult('complete', { success: true }, ctx);
  }

  // ═══════════════════════════════════════════════════════════════
  // RESULT FACTORY
  // ═══════════════════════════════════════════════════════════════

  private static _createResult(
    step: ValidationStep,
    result: StepResult,
    ctx?: ValidationContext
  ): ApiValidationResult {
    const resolved = result.resolved || ctx?.resolved;
    const accountId = result.accountId || ctx?.accountId;
    const userId = result.userId || ctx?.userId;

    // Build AuthData from resolved session data
    const convertedAuthData: AuthData | undefined = resolved ? {
      user: {
        id: resolved.userId,
        email: resolved.email,
        firstName: resolved.firstName ?? undefined,
        lastName: resolved.lastName ?? undefined,
        emailVerified: resolved.emailVerified,
        phoneVerified: resolved.phoneVerified,
      },
      account: {
        id: resolved.accountId,
        role: resolved.roleName,
        permissions: resolved.permissions,
        workspaceId: resolved.workspaceId,
        workspaceType: resolved.workspaceType,
        subscriptionTier: resolved.subscriptionTier ?? undefined,
        subscribedUntil: resolved.subscribedUntil ?? undefined,
      },
      session: {
        id: resolved.sessionId,
        userId: resolved.userId,
        accountId: resolved.accountId,
        createdAt: '',
        lastActivityAt: ''
      }
    } : undefined;

    const authContext: AuthContext = {
      userId: userId || "guest",
      accountId: accountId || "0",
      permissions: resolved?.permissions || [],
      activeWorkspaceId: resolved?.workspaceId ?? undefined,
      workspaceType: resolved?.workspaceType ?? undefined,
      role: resolved?.roleName ?? undefined,
      subscriptionActive: resolved?.subscribedUntil ? resolved.subscribedUntil > Date.now() : undefined,
    };

    return {
      isValid: result.success,
      code: result.code,
      authData: convertedAuthData,
      ctx: authContext,
      accountId: accountId || undefined,
      userId: userId || undefined,
      needsRefresh: result.needsRefresh,
      step
    } as ApiValidationResult;
  }
}
