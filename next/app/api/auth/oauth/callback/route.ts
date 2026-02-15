import { NextRequest } from 'next/server';
import { unifiedApiHandler } from '@/lib/middleware/handlers';
import {
  OAUTH_CONFIGS,
  getOAuthAccessToken,
  getOAuthUserData,
  getOAuthBaseUrl,
  linkOAuthProvider,
} from '@/lib/middleware/authenticators/OAuthAuthenticator';
import { SessionStore } from '@/lib/middleware/authenticators/SessionStore';
import { CookieAuthenticator } from '@/lib/middleware/authenticators/CookieAuthenticator';
import { ConsoleLogger } from '@/lib/logging/ConsoleLogger';
import { AuthRepository } from '@/lib/domain/auth/auth.repository';
import { db } from '@/lib/database';
import { hashPassword } from '@/lib/domain/auth/password.util';
import { generateSlimId } from '@/lib/utils/ids/SlimUlidUtil';
import crypto from 'crypto';
import { okResponse, errorResponse, serverErrorResponse } from '@/lib/middleware/responses/ApiResponse';

export const POST = unifiedApiHandler(async (req: NextRequest) => {
  try {
    const {
      code,
      provider,
      deviceInfo,
      emailByOAuthProvider,
    } = await req.json();

    if (!code || !provider) {
      return errorResponse('Authorization code and provider are required', 400);
    }

    const config = OAUTH_CONFIGS[provider as keyof typeof OAUTH_CONFIGS];
    if (!config) {
      return errorResponse('Invalid provider', 400);
    }

    const redirectUri = getOAuthBaseUrl() + `/auth/oauth/callback`;

    // Get OAuth token
    const { oauthTokenData, error: oauthTokenError } = await getOAuthAccessToken({
      code,
      config,
      redirectUri
    });

    if (oauthTokenError || !oauthTokenData) {
      return serverErrorResponse(oauthTokenError || 'Failed to get OAuth token');
    }

    // Get user data from OAuth provider
    let userData: Record<string, string | undefined>;
    try {
      userData = await getOAuthUserData({
        accessToken: oauthTokenData.access_token,
        provider,
        config
      });
    } catch {
      return serverErrorResponse('Failed to get user data from OAuth provider');
    }

    // If email is missing and not provided manually, request it from the user
    if (!userData.email && !emailByOAuthProvider) {
      return errorResponse('Email is required', 428);
    }

    // Use manually provided email if no email from OAuth
    if (!userData.email && emailByOAuthProvider) {
      userData.email = emailByOAuthProvider;
    }

    const repo = new AuthRepository(db);
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ||
      req.headers.get('x-real-ip') ||
      '0.0.0.0';

    const existingUser = await repo.findUserByEmail(userData.email!);

    let userId: string;
    let accountId: string;
    let email: string;
    let firstName: string | null = null;

    if (!existingUser) {
      // Create new user + account via auth.repository
      const newUserId = generateSlimId();
      const newAccountId = generateSlimId();
      const newWorkspaceId = generateSlimId();
      const randomPassword = crypto.randomBytes(16).toString('hex');
      const { hashedPassword } = await hashPassword({ password: randomPassword });

      const result = await repo.createUserWithAccount({
        id: newUserId,
        email: userData.email!,
        phone: null,
        firstName: userData.name || 'User',
        passwordHash: hashedPassword,
        accountId: newAccountId,
        workspaceId: newWorkspaceId,
      });

      userId = result.user.id;
      accountId = result.account.id;
      email = result.user.email;
      firstName = result.user.firstName;
    } else {
      // Link OAuth provider to existing user
      const { error: linkError } = await linkOAuthProvider({
        userId: existingUser.id,
        provider: provider,
        providerId: userData.id || '',
        providerData: { name: userData.name }
      });

      if (linkError) {
        ConsoleLogger.error('Failed to link OAuth provider:', linkError);
        return serverErrorResponse('Failed to link OAuth provider');
      }

      const account = await repo.findAccountByUserId(existingUser.id);
      if (!account) {
        return serverErrorResponse('Account not found for existing user');
      }

      userId = existingUser.id;
      accountId = account.id;
      email = existingUser.email;
      firstName = existingUser.firstName;
    }

    // Create Redis session via SessionStore
    const session = await SessionStore.create({
      accountId,
      userId,
      email,
      firstName,
      lastName: null,
      emailVerified: true,  // OAuth-verified email
      phoneVerified: false,
      meta: {
        ip,
        userAgent: deviceInfo?.userAgent || 'unknown',
      },
    });

    if (!session) {
      return serverErrorResponse('Failed to create session');
    }

    // Create response
    const response = okResponse({
      session: session.sessionId,
    }, 'Authentication successful');

    // Set session cookie (14-day TTL)
    const expireAt = new Date();
    expireAt.setDate(expireAt.getDate() + 14);

    const { authCookiesResponse } = CookieAuthenticator.setAuthCookies({
      response,
      data: {
        session: session.sessionId,
        expireAt,
      }
    });

    return authCookiesResponse;
  } catch (error) {
    ConsoleLogger.error('OAuth Callback Error', error as Error);
    return serverErrorResponse('Internal Server Error');
  }
});
