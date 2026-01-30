// ═══════════════════════════════════════════════════════════════
// OAUTH TYPES
// ═══════════════════════════════════════════════════════════════
// Types for OAuth provider authentication

export enum OAuthProvider {
  GOOGLE = 'google',
  FACEBOOK = 'facebook',
  APPLE = 'apple',
}

export interface OAuthProfile {
  provider: OAuthProvider;
  providerId: string;
  email: string;
  name?: string;
  avatar?: string;
  rawProfile: any;
}

export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  scope?: string;
}

