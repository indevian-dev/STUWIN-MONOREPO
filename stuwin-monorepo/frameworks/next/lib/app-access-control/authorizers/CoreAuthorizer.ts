import { CookieAuthenticator } from '@/lib/app-access-control/authenticators/CookieAuthenticator';
import { SessionAuthenticator } from '@/lib/app-access-control/authenticators/SessionAuthenticator';
import { getUserData, type GetUserDataResult } from '@/lib/app-access-control/authenticators/IdentityAuthenticator';
import logger from '@/lib/app-infrastructure/loggers/Logger';
import type { EndpointConfig, ApiValidationResult } from '@/types';
import { ConsoleLogger } from '@/lib/app-infrastructure/loggers/ConsoleLogger';

// ═══════════════════════════════════════════════════════════════
// TYPES & CONSTANTS
// ═══════════════════════════════════════════════════════════════

type InternalAuthData = GetUserDataResult;

type ValidationCode =
  | 'UNAUTHORIZED' // Merged: NO_TOKENS, NO_TOKEN, TOKEN_EXPIRED, TOKEN_INVALID, SESSION_INVALID, AUTH_DATA_MISSING
  | 'ACCOUNT_SUSPENDED'
  | 'EMAIL_NOT_VERIFIED' | 'PHONE_NOT_VERIFIED'
  | 'PERMISSION_DENIED' | 'WORKSPACE_MISMATCH'
  | '2FA_EMAIL_REQUIRED' | '2FA_PHONE_REQUIRED' | '2FA_TYPE_UNKNOWN'
  | 'VERIFY_EMAIL_REQUIRED' | 'VERIFY_PHONE_REQUIRED'
  | 'SUBSCRIPTION_REQUIRED';

type ValidationStep = 'tokens' | 'token' | 'status' | 'workspace' | 'permission' | '2fa' | 'complete';

interface ValidationContext {
  session: string | undefined;
  endpointConfig?: EndpointConfig;
  requiredPermissions: string[];
  authData?: InternalAuthData;
  accountId?: string;
  userId?: string;
  workspaceId?: string;
}

interface StepResult {
  success: boolean;
  code?: ValidationCode;
  authData?: InternalAuthData;
  accountId?: string;
  userId?: string;
  needsRefresh?: boolean;
}

// ═══════════════════════════════════════════════════════════════
// VALIDATION HELPERS
// ═══════════════════════════════════════════════════════════════

function checkAccountStatus(
  authData: InternalAuthData | undefined,
  needEmailVerification: boolean | undefined,
  needPhoneVerification: boolean | undefined
): StepResult {
  if (!authData?.account || !authData?.user) {
    return { success: false, code: 'UNAUTHORIZED' };
  }
  if (authData.account.suspended) {
    return { success: false, code: 'ACCOUNT_SUSPENDED' };
  }

  if (needEmailVerification && !authData.user.emailVerified) {
    return { success: false, code: 'EMAIL_NOT_VERIFIED' };
  }

  if (needPhoneVerification && !authData.user.phoneVerified) {
    return { success: false, code: 'PHONE_NOT_VERIFIED' };
  }

  return { success: true };
}

function hasPermission(authData: InternalAuthData | undefined, permission: string): boolean {
  // Check if permission is granted by role
  const hasRolePermission = (authData?.account as any)?.permissions?.includes(permission) ?? false;
  if (hasRolePermission) {
    return true;
  }

  // Automatically grant provider permissions to provider accounts
  if (permission.startsWith('PROVIDER_') && (authData?.account as any)?.workspaceType === 'provider') {
    return true;
  }

  // Automatically grant staff permissions to staff accounts
  if (permission.startsWith('STAFF_') && (authData?.account as any)?.isStaff === true) {
    return true;
  }

  // Automatically grant student permissions to student accounts (default for personal accounts)
  if (permission.startsWith('STUDENT_') && (authData?.account as any)?.isPersonal === true) {
    return true;
  }

  return false;
}

function check2FAExpiry(expiryField: string | undefined): StepResult {
  if (!expiryField) {
    return { success: false };
  }

  const expireAt = new Date(expiryField);
  return {
    success: expireAt > new Date()
  };
}

// ═══════════════════════════════════════════════════════════════
// VALIDATION STEPS (composable validators)
// ═══════════════════════════════════════════════════════════════

class ValidationSteps {


  static async validateSession(ctx: ValidationContext): Promise<StepResult> {
    if (!ctx.session) {
      // If auth is NOT required, return success (Guest mode)
      if (ctx.endpointConfig?.authRequired === false) {
        return { success: true };
      }

      logger.error('No session ID provided');
      return { success: false, code: 'UNAUTHORIZED' };
    }

    const { isValid, session: sessionData, needsRollover } = await SessionAuthenticator.verifySession(ctx.session);

    if (!isValid || !sessionData) {
      // If auth is NOT required, return success (Guest mode) despite invalid token
      if (ctx.endpointConfig?.authRequired === false) {
        return { success: true };
      }

      logger.error('Session invalid or expired');
      return { success: false, code: 'UNAUTHORIZED' };
    }

    const { accountId } = sessionData;

    // Load full auth data with workspace context
    const authData = await getUserData({
      type: 'account_id',
      accountId,
      workspaceId: ctx.workspaceId
    });
    logger.debug('User authentication data retrieved', { accountId });

    if (!authData?.account) {
      // If auth is NOT required, return success (Guest mode)
      if (ctx.endpointConfig?.authRequired === false) {
        return { success: true };
      }

      logger.error('Account not found for valid session');
      return { success: false, code: 'UNAUTHORIZED', accountId };
    }

    // Handle Rollover (return it in the result so the interceptor can set the header/cookie)
    if (needsRollover) {
      logger.debug('Session needs rollover', { accountId });
    }

    return {
      success: true,
      authData,
      accountId,
      userId: authData.user?.id,
      needsRefresh: needsRollover // Re-using needsRefresh flag to trigger cookie update
    };
  }

  static validateStatus(ctx: ValidationContext): StepResult {
    ConsoleLogger.log('Validating account status', {
      hasEndpointConfig: !!ctx.endpointConfig,
      needEmailVerification: ctx.endpointConfig?.needEmailVerification,
      needPhoneVerification: ctx.endpointConfig?.needPhoneVerification
    });

    // If guest (no authData) and auth optional, skip status checks
    if (!ctx.authData && ctx.endpointConfig?.authRequired === false) {
      return { success: true };
    }

    const result = checkAccountStatus(ctx.authData, ctx.endpointConfig?.needEmailVerification, ctx.endpointConfig?.needPhoneVerification);

    if (!result.success && result.code) {
      logger.warn(`Account status check failed: ${result.code}`);
    }

    return result;
  }

  static validateEmailVerification(ctx: ValidationContext): StepResult {
    const config = ctx.endpointConfig as any;

    if (!config?.needEmailVerification) {
      return { success: true };
    }

    const user = ctx.authData?.user as any;

    if (!user?.emailVerified) {
      logger.warn('Email verification required but not verified');
      return { success: false, code: 'EMAIL_NOT_VERIFIED' };
    }

    logger.debug('Email verification validated');
    return { success: true };
  }

  static validatePhoneVerification(ctx: ValidationContext): StepResult {
    const config = ctx.endpointConfig as any;

    if (!config?.needPhoneVerification) {
      return { success: true };
    }

    const user = ctx.authData?.user as any;

    if (!user?.phoneVerified) {
      logger.warn('Phone verification required but not verified');
      return { success: false, code: 'PHONE_NOT_VERIFIED' };
    }

    logger.debug('Phone verification validated');
    return { success: true };
  }

  static validateWorkspace(ctx: ValidationContext): StepResult {
    const endpointWorkspace = ctx.endpointConfig?.workspace;
    const accountWorkspace = ctx.authData?.account?.workspaceType;
    const isStaff = ctx.authData?.account?.isStaff;

    if (endpointWorkspace && accountWorkspace && endpointWorkspace !== accountWorkspace) {
      // Allow STAFF members to access any workspace type
      if (isStaff) {
        logger.debug('Workspace mismatch ignored for STAFF member', {
          endpointWorkspace,
          accountWorkspace,
          accountId: ctx.accountId
        });
        return { success: true };
      }

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

    console.log('Validating permissions', {
      endpointConfig: ctx.endpointConfig,
      requiredPermissions: ctx.requiredPermissions
    });
    // Check endpoint config permission
    const configPermission = ctx.endpointConfig?.permission;
    if (configPermission && !hasPermission(ctx.authData, configPermission)) {
      logger.warn('Permission denied', { permission: configPermission });
      return { success: false, code: 'PERMISSION_DENIED' };
    }

    // Check required permissions array
    for (const permission of ctx.requiredPermissions) {
      if (!hasPermission(ctx.authData, permission)) {
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

  static validate2FA(ctx: ValidationContext): StepResult {
    const config = ctx.endpointConfig as any;
    const tfaType = config?.twoFactorAuthType;

    if (!config?.twoFactorAuth || !tfaType) {
      return { success: true };
    }

    const user = ctx.authData?.user as any;
    let result: StepResult;

    switch (tfaType) {
      case 'email':
        result = check2FAExpiry(user?.two_factor_auth_email_expire_at);
        break;
      case 'phone':
        result = check2FAExpiry(user?.two_factor_auth_phone_expire_at);
        break;
      default:
        logger.error('2FA type unknown');
        return { success: false, code: '2FA_TYPE_UNKNOWN' };
    }

    if (!result.success) {
      logger.warn('2FA required', { twoFactorAuthType: tfaType });
      return {
        success: false,
        code: `2FA_${tfaType.toUpperCase()}_REQUIRED` as ValidationCode
      };
    }

    logger.debug('2FA validated');
    return { success: true };
  }

  static validateSubscription(ctx: ValidationContext): StepResult {
    const config = ctx.endpointConfig;
    if (!config?.checkSubscriptionStatus) {
      return { success: true };
    }

    const authData = ctx.authData;
    const accountSubEnd = authData?.account?.subscribedUntil;
    const workspaceSubEnd = authData?.account?.workspaceSubscribedUntil;

    const now = new Date();
    const isSubscribed = (accountSubEnd && new Date(accountSubEnd) > now) ||
      (workspaceSubEnd && new Date(workspaceSubEnd) > now);

    if (!isSubscribed) {
      logger.warn('Subscription required but not active', { accountId: ctx.accountId });
      return { success: false, code: 'SUBSCRIPTION_REQUIRED' };
    }

    logger.debug('Subscription validated');
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
    endpointConfig?: EndpointConfig;
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

    // Step 1: Validate session & load auth data
    const sessionResult = await ValidationSteps.validateSession(ctx);
    if (!sessionResult.success) {
      return this._createResult('token', sessionResult);
    }

    // Update context with auth data
    ctx.authData = sessionResult.authData;
    ctx.accountId = sessionResult.accountId;
    ctx.userId = sessionResult.userId;

    // Step 3: Validate account status
    const statusResult = ValidationSteps.validateStatus(ctx);
    if (!statusResult.success) {
      return this._createResult('status', statusResult, ctx);
    }

    // Step 4: Validate workspace mismatch
    const workspaceResult = ValidationSteps.validateWorkspace(ctx);
    if (!workspaceResult.success) {
      return this._createResult('workspace', workspaceResult, ctx);
    }

    // Step 5: Validate permissions
    const permResult = ValidationSteps.validatePermissions(ctx);
    if (!permResult.success) {
      return this._createResult('permission', permResult, ctx);
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

    // Step 8: Validate 2FA
    const tfaResult = ValidationSteps.validate2FA(ctx);
    if (!tfaResult.success) {
      return this._createResult('2fa', tfaResult, ctx);
    }

    // Step 9: Validate Subscription
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
    const authData = result.authData || ctx?.authData;
    const accountId = result.accountId || ctx?.accountId;
    const userId = result.userId || ctx?.userId;

    // Convert to API format
    const convertedAuthData = authData ? {
      user: authData.user!,
      account: authData.account!,
      session: {
        id: '',
        userId: authData.user?.id || '',
        accountId: authData.account?.id || 0,
        createdAt: '',
        lastActivityAt: ''
      }
    } : undefined;

    const authContext: any = {
      userId: userId || "guest",
      accountId: accountId || "0",
      permissions: authData?.account?.permissions || [],
      allowedWorkspaceIds: [], // Not directly available in current GetUserDataResult
      activeWorkspaceId: authData?.account?.workspaceId
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
