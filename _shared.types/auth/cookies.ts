export interface CookieConfig {
  name: string;
  value: string;
  options: {
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'strict' | 'lax' | 'none';
    maxAge?: number;
    expires?: Date;
    path?: string;
    domain?: string;
  };
}

export interface AuthCookies {
  accessToken: CookieConfig;
  refreshToken: CookieConfig;
  sessionId: CookieConfig;
  accountId: CookieConfig;
}
