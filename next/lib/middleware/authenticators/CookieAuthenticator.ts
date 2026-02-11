import { cookies } from 'next/headers';
import type { NextRequest, NextResponse } from 'next/server';

import { ConsoleLogger } from '@/lib/logging/ConsoleLogger';
/**
 * Cookie Manager
 * 
 * Only manages auth tokens:
 * - accessToken: JWT with user, account, sessionId in payload
 * - refreshToken: JWT with sessionId for token refresh
 */

const COOKIES = {
  SESSION: 'session'
} as const;

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: (process.env.NODE_ENV === 'production' ? 'strict' : 'lax') as 'strict' | 'lax',
  path: '/'
} as const;

interface AuthCookiesData {
  session: string | undefined;
  hasSession: boolean;
}

export class CookieAuthenticator {
  /**
   * Get auth cookies from middleware (synchronous, reads from NextRequest)
   * Use this in middleware.ts only
   */
  static getAuthCookiesFromRequest(request: NextRequest): {
    authCookiesData: AuthCookiesData;
  } {
    const session = request.cookies.get(COOKIES.SESSION)?.value;

    return {
      authCookiesData: {
        session,
        hasSession: !!session
      }
    };
  }

  /**
   * Get auth cookies (automatically reads from next/headers)
   * Works in both API Routes and Server Components
   */
  static async getAuthCookies(): Promise<{
    authCookiesData: AuthCookiesData;
  }> {
    const cookieStore = await cookies();
    const session = cookieStore.get(COOKIES.SESSION)?.value;

    return {
      authCookiesData: {
        session,
        hasSession: !!session
      }
    };
  }

  /**
   * Set auth cookies on response
   */
  static setAuthCookies({
    response,
    data
  }: {
    response: NextResponse;
    data: {
      session?: string;
      expireAt?: Date;
    };
  }): { authCookiesResponse: NextResponse } {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid data provided to setAuthCookies');
    }

    const { session, expireAt } = data;

    if (session) {
      const maxAge = expireAt
        ? Math.floor((expireAt.getTime() - Date.now()) / 1000)
        : 60 * 60 * 24 * 14;

      response.cookies.set(COOKIES.SESSION, session, {
        ...COOKIE_OPTIONS,
        maxAge
      });
    }

    return { authCookiesResponse: response };
  }

  /**
   * Clear auth cookies (logout)
   */
  static clearAuthCookies({ response }: { response: NextResponse }): {
    authCookiesResponse: NextResponse;
  } {
    response.cookies.set(COOKIES.SESSION, '', { ...COOKIE_OPTIONS, maxAge: 0 });

    ConsoleLogger.log((`✓ Auth cookies cleared`));
    return { authCookiesResponse: response };
  }
}

