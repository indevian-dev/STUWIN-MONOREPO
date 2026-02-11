import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { unifiedApiHandler } from '@/lib/middleware/handlers';
import {
  verifyUserExists,
  createUserWithAccount,
  getUserData,
} from '@/lib/middleware/authenticators/IdentityAuthenticator';
import {
  OAUTH_CONFIGS,
  getOAuthAccessToken,
  getOAuthUserData,
  getOAuthBaseUrl,
  linkOAuthProvider,
} from '@/lib/middleware/authenticators/OAuthAuthenticator';
import { SessionAuthenticator } from '@/lib/middleware/authenticators/SessionAuthenticator';
import { CookieAuthenticator } from '@/lib/middleware/authenticators/CookieAuthenticator';
import { ConsoleLogger } from '@/lib/logging/ConsoleLogger';

export const POST = unifiedApiHandler(async (req: NextRequest, { params }: any) => {
  try {
    const {
      code,
      provider,
      deviceInfo,
      emailByOAuthProvider: emailByOAuthProvider
    } = await req.json();

    if (!code || !provider) {
      return NextResponse.json(
        { error: 'Authorization code and provider are required' },
        { status: 400 }
      );
    }

    const config = OAUTH_CONFIGS[provider as keyof typeof OAUTH_CONFIGS];
    if (!config) {
      return NextResponse.json(
        { error: 'Invalid provider' },
        { status: 400 }
      );
    }

    const redirectUri = getOAuthBaseUrl() + `/auth/oauth/callback`;

    // Get OAuth token
    const { oauthTokenData, error: oauthTokenError } = await getOAuthAccessToken({
      code,
      config,
      redirectUri
    });

    if (oauthTokenError || !oauthTokenData) {
      return NextResponse.json(
        { error: oauthTokenError || 'Failed to get OAuth token' },
        { status: 500 }
      );
    }

    // Get user data from OAuth provider
    let userData: any;
    try {
      userData = await getOAuthUserData({
        accessToken: oauthTokenData.access_token,
        provider,
        config
      });
    } catch (error: unknown) {
      return NextResponse.json(
        { error: 'Failed to get user data from OAuth provider' },
        { status: 500 }
      );
    }

    // If email is missing and not provided manually, request it from the user
    if (!userData.email && !emailByOAuthProvider) {
      return NextResponse.json(
        { error: 'Email is required', needEmail: true },
        { status: 428 }
      );
    }

    // Use manually provided email if no email from OAuth
    if (!userData.email && emailByOAuthProvider) {
      userData.email = emailByOAuthProvider;
    }

    const { existingUser } = await verifyUserExists({
      email: userData.email,
      phone: undefined
    });

    // Get IP from request
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ||
      req.headers.get('x-real-ip') ||
      '0.0.0.0';

    let user: any = null, account: any = null;

    if (!existingUser) {
      // Create new user with account
      const { success, createdUser, createdAccount, error } = await createUserWithAccount({
        email: userData.email,
        provider: provider,
        providerId: userData.id,
        providerData: {
          name: userData.name
        }
      });

      if (!success || !createdUser || !createdAccount) {
        ConsoleLogger.error('Failed to create user:', error);
        return NextResponse.json(
          { error: error ?? 'Failed to create user' },
          { status: 500 }
        );
      }
      user = createdUser;
      account = createdAccount;
    } else {
      // Link OAuth provider to existing user
      const { error: linkError } = await linkOAuthProvider({
        userId: existingUser.id,
        provider: provider,
        providerId: userData.id,
        providerData: {
          name: userData.name
        }
      });

      if (linkError) {
        ConsoleLogger.error('Failed to link OAuth provider:', linkError);
        return NextResponse.json(
          { error: 'Failed to link OAuth provider' },
          { status: 500 }
        );
      }

      // Get the user's account
      const { user: existingUserData, account: existingAccountData } = await getUserData({
        type: 'user_id',
        userId: existingUser.id
      });
      user = existingUserData;
      account = existingAccountData;
    }

    // Validate we have user and account
    if (!user || !account) {
      ConsoleLogger.error('User or account is null after creation/lookup');
      return NextResponse.json(
        { error: 'Failed to get user or account data' },
        { status: 500 }
      );
    }

    // Create session in the database (stateful)
    const sessionResult = await SessionAuthenticator.createSession({
      accountId: account.id,
      sessionsGroupId: uuidv4(),
      ip: ip,
      userAgent: deviceInfo?.userAgent || 'Unknown',
    });

    if (!sessionResult) {
      ConsoleLogger.error('Failed to create session');
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      );
    }

    const { sessionId, expireAt } = sessionResult;

    // Create response indicating success
    let response = NextResponse.json(
      {
        success: true,
        message: 'Authentication successful',
        data: {
          session: sessionId,
          expireAt: expireAt,
        },
      },
      { status: 200 }
    );

    // Set authentication cookies
    const { authCookiesResponse } = CookieAuthenticator.setAuthCookies({
      response: response,
      data: {
        session: sessionId,
        expireAt: expireAt,
      }
    });

    return authCookiesResponse;
  } catch (error) {
    ConsoleLogger.error('OAuth Callback Error', error as Error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
});
