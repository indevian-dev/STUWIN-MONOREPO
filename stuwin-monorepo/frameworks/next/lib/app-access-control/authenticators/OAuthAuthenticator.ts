import { headers } from 'next/headers';
import { db } from '@/lib/app-infrastructure/database';
import type { OAuthProvider, OAuthTokenData, OAuthUserInfo } from '@/types';

import { ConsoleLogger } from '@/lib/app-infrastructure/loggers/ConsoleLogger';
interface OAuthConfig {
  tokenUrl: string;
  userInfoUrl: string | null;
  clientId: string;
  clientSecret: string;
  provider?: OAuthProvider;
}

export const OAUTH_CONFIGS: Record<OAuthProvider, Omit<OAuthConfig, 'provider'>> = {
  google: {
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  },
  facebook: {
    tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
    userInfoUrl: 'https://graph.facebook.com/me',
    clientId: process.env.FACEBOOK_CLIENT_ID!,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
  },
  apple: {
    tokenUrl: 'https://appleid.apple.com/auth/token',
    userInfoUrl: null,
    clientId: process.env.APPLE_CLIENT_ID!,
    clientSecret: process.env.APPLE_CLIENT_SECRET!,
  }
};

export async function getOAuthAccessToken({
  code,
  config,
  redirectUri
}: {
  code: string;
  config: OAuthConfig;
  redirectUri: string;
}): Promise<{
  oauthTokenData: OAuthTokenData | null;
  error: string | null;
}> {
  const params: Record<string, string> = {
    code,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  };

  if (config.provider === 'apple') {
    // Add additional Apple-specific parameters if needed
  }

  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(params),
  });

  if (!response.ok) {
    return { oauthTokenData: null, error: await response.text() };
  }

  const oauthTokenData = await response.json() as OAuthTokenData;

  ConsoleLogger.log((`oauthTokenData **************`), oauthTokenData);

  return { oauthTokenData: oauthTokenData, error: null };
}

export async function getOAuthUserData({
  accessToken,
  provider,
  config
}: {
  accessToken: string;
  provider: OAuthProvider;
  config: OAuthConfig;
}): Promise<OAuthUserInfo> {
  if (provider === 'apple') {
    return decodeAppleIdToken(accessToken);
  }

  const userInfoParams = provider === 'facebook' ?
    '?fields=id,email,name&' : '';

  const response = await fetch(`${config.userInfoUrl}${userInfoParams}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return response.json() as Promise<OAuthUserInfo>;
}

export const getOAuthBaseUrl = async (): Promise<string> => {
  const headersList = await headers();
  const protocol = headersList.get('x-forwarded-proto') || 'http';
  const host = headersList.get('host');

  return `${protocol}://${host}`;
};

const PROVIDER_COLUMN_MAP: Record<OAuthProvider, keyof typeof users.$inferSelect> = {
  google: 'googleId',
  facebook: 'facebookId',
  apple: 'appleId'
};

interface ProviderData {
  name?: string;
  last_name?: string;
  avatar_url?: string;
}

export async function linkOAuthProvider({
  userId,
  provider,
  providerId,
  providerData = {}
}: {
  userId: string;
  provider: OAuthProvider;
  providerId: string;
  providerData?: ProviderData;
}): Promise<{
  success: boolean;
  error: string | null;
}> {
  try {
    if (!userId || !provider || !providerId) {
      return {
        success: false,
        error: 'User ID, provider, and provider ID are required'
      };
    }

    const providerColumn = PROVIDER_COLUMN_MAP[provider];
    if (!providerColumn) {
      return { success: false, error: 'Unsupported provider' };
    }

    // Check if current user already has this provider linked
    const existingUsers = await db.query(
      'SELECT googleId, facebookId, appleId FROM users WHERE id = $userId LIMIT 1',
      { userId }
    );
    const existingUser = existingUsers[0];

    if (existingUser) {
      const currentProviderValue = existingUser[providerColumn as 'googleId' | 'facebookId' | 'appleId'];
      if (currentProviderValue) {
        return {
          success: false,
          error: `User already has ${provider} account linked`
        };
      }
    }

    // Check if this provider account is already linked to another user
    let existingProviderUsers;
    if (provider === 'google') {
      existingProviderUsers = await db.query(
        'SELECT id, email FROM users WHERE googleId = $providerId LIMIT 1',
        { providerId }
      );
    } else if (provider === 'facebook') {
      existingProviderUsers = await db.query(
        'SELECT id, email FROM users WHERE facebookId = $providerId LIMIT 1',
        { providerId }
      );
    } else if (provider === 'apple') {
      existingProviderUsers = await db.query(
        'SELECT id, email FROM users WHERE appleId = $providerId LIMIT 1',
        { providerId }
      );
    }

    const existingProviderUser = existingProviderUsers?.[0];

    if (existingProviderUser && existingProviderUser.id !== userId) {
      return {
        success: false,
        error: 'Provider account already linked to another user'
      };
    }

    // Build update object with proper typing
    const updateFields: Partial<typeof users.$inferInsert> = {
      emailIsVerified: true
    };
    
    if (provider === 'google') updateFields.googleId = providerId;
    else if (provider === 'facebook') updateFields.facebookId = providerId;
    else if (provider === 'apple') updateFields.appleId = providerId;
    
    if (providerData.name) updateFields.name = providerData.name;
    if (providerData.last_name) updateFields.lastName = providerData.last_name;
    if (providerData.avatar_url) updateFields.avatarUrl = providerData.avatar_url;

    await db.query(
      'UPDATE users SET googleId = $googleId, facebookId = $facebookId, appleId = $appleId, name = $name, lastName = $lastName, avatarUrl = $avatarUrl, updatedAt = $updatedAt WHERE id = $userId',
      {
        googleId: updateFields.googleId,
        facebookId: updateFields.facebookId,
        appleId: updateFields.appleId,
        name: updateFields.name,
        lastName: updateFields.lastName,
        avatarUrl: updateFields.avatarUrl,
        updatedAt: new Date().toISOString(),
        userId
      }
    );

    ConsoleLogger.log((`OAuth provider ${provider} linked to user ${userId}`));

    return {
      success: true,
      error: null
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    ConsoleLogger.log((`linkOAuthProvider error:`), errorMessage);
    return {
      success: false,
      error: errorMessage
    };
  }
}

// Apple ID token decoding (placeholder - implement as needed)
function decodeAppleIdToken(token: string): OAuthUserInfo {
  // TODO: Implement Apple ID token decoding
  return {
    id: '',
    providerId: '',
    email: '',
    provider: 'apple'
  };
}

