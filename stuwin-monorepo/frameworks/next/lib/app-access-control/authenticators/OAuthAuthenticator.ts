import { headers } from 'next/headers';
import { db } from '@/lib/app-infrastructure/database';
import { OAuthProvider } from '@/types';
import type { OAuthTokenData, OAuthUserInfo } from '@/types';
import { eq } from 'drizzle-orm';
import { users, userCredentials } from '@/lib/app-infrastructure/database/schema';
import { ConsoleLogger } from '@/lib/app-infrastructure/loggers/ConsoleLogger';

interface OAuthConfig {
  tokenUrl: string;
  userInfoUrl: string | null;
  clientId: string;
  clientSecret: string;
  provider?: OAuthProvider;
}

export const OAUTH_CONFIGS: Record<OAuthProvider, Omit<OAuthConfig, 'provider'>> = {
  [OAuthProvider.GOOGLE]: {
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  },
  [OAuthProvider.FACEBOOK]: {
    tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
    userInfoUrl: 'https://graph.facebook.com/me',
    clientId: process.env.FACEBOOK_CLIENT_ID!,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
  },
  [OAuthProvider.APPLE]: {
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

  if (config.provider === OAuthProvider.APPLE) {
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
  if (provider === OAuthProvider.APPLE) {
    return decodeAppleIdToken(accessToken);
  }

  const userInfoParams = provider === OAuthProvider.FACEBOOK ?
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

const PROVIDER_COLUMN_MAP: Record<OAuthProvider, "googleId" | "facebookId" | "appleId"> = {
  [OAuthProvider.GOOGLE]: 'googleId',
  [OAuthProvider.FACEBOOK]: 'facebookId',
  [OAuthProvider.APPLE]: 'appleId'
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

    // 1. Check if ANY user already has this provider account linked
    // (Ensure uniqueness of OAuth ID across system)
    const existingProviderUser = await db.query.userCredentials.findFirst({
      where: eq(userCredentials[providerColumn], providerId),
      columns: {
        userId: true
      }
    });

    if (existingProviderUser && existingProviderUser.userId !== userId) {
      return {
        success: false,
        error: 'Provider account already linked to another user'
      };
    }

    // 2. Check/Get current user's credentials record
    let userCreds = await db.query.userCredentials.findFirst({
      where: eq(userCredentials.userId, userId),
    });

    // 3. Prevent overwriting if already linked to SAME provider (optional safeguard)
    if (userCreds) {
      const currentVal = userCreds[providerColumn];
      if (currentVal && currentVal !== providerId) {
        // Already linked to A DIFFERENT account of same provider? 
        // Or same? If same, we can just proceed (idempotent) or return success.
        if (currentVal === providerId) {
          // Already linked correctly.
        } else {
          return { success: false, error: `User already linked to a different ${provider} account` };
        }
      }
    }

    // 4. Update Profile (users table)
    const userUpdates: Partial<typeof users.$inferInsert> = {
      emailIsVerified: true,
      updatedAt: new Date()
    };
    if (providerData.name) userUpdates.firstName = providerData.name;
    if (providerData.last_name) userUpdates.lastName = providerData.last_name;
    if (providerData.avatar_url) userUpdates.avatarUrl = providerData.avatar_url;

    await db.update(users)
      .set(userUpdates)
      .where(eq(users.id, userId));

    // 5. Update Credentials (user_credentials table)
    const credUpdates: Partial<typeof userCredentials.$inferInsert> = {};
    if (provider === OAuthProvider.GOOGLE) credUpdates.googleId = providerId;
    if (provider === OAuthProvider.FACEBOOK) credUpdates.facebookId = providerId;
    if (provider === OAuthProvider.APPLE) credUpdates.appleId = providerId;

    if (userCreds) {
      await db.update(userCredentials)
        .set(credUpdates)
        .where(eq(userCredentials.id, userCreds.id));
    } else {
      // Create credentials if missing
      await db.insert(userCredentials).values({
        id: userId, // Assuming 1:1 map as per schema FK on ID
        userId: userId,
        createdAt: new Date(),
        ...credUpdates
      });
    }

    ConsoleLogger.log(`OAuth provider ${provider} linked to user ${userId}`);

    return {
      success: true,
      error: null
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    ConsoleLogger.error(`linkOAuthProvider error:`, error);
    ConsoleLogger.error(errorMessage);
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
    provider: OAuthProvider.APPLE
  };
}
