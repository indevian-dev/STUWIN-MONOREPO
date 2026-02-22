import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { routing } from '@/i18n/routing';
import createMiddleware from 'next-intl/middleware';

const intlMiddleware = createMiddleware(routing);

type IntlResult = {
  redirect?: NextResponse;
  intlResponse?: NextResponse;
};

export class EdgeGuard {

  private static _getIntlResponse(request: NextRequest, locale: string | null = null): IntlResult {
    const intlResponse = intlMiddleware(request);
    if (intlResponse.status >= 300 && intlResponse.status < 400) {
      return { redirect: intlResponse };
    }
    return { intlResponse };
  }

  static createInternalServerErrorApiResponse(): NextResponse {
    return new NextResponse(JSON.stringify({ message: 'Internal server error' }), { status: 500 });
  }

  static createUnauthorizedPageResponse({ request, locale }: {
    request: NextRequest;
    locale: string | null;
  }): NextResponse {
    const intlResult = this._getIntlResponse(request, locale);
    if (intlResult.redirect) {
      return intlResult.redirect;
    }
    const loginPath = this.buildLocalizedPath({ path: '/auth/login', locale: locale });
    const redirectUrl = `${request.nextUrl.origin}${loginPath}?redirect=${encodeURIComponent(request.nextUrl.pathname)}`;
    return NextResponse.redirect(redirectUrl, {
      status: 302,
      headers: intlResult.intlResponse!.headers
    });
  }

  static createForbiddenPageResponse({ locale, request }: {
    locale: string | null;
    request: NextRequest;
  }): NextResponse {
    const intlResult = this._getIntlResponse(request, locale);
    if (intlResult.redirect) {
      return intlResult.redirect;
    }
    const forbiddenPath = this.buildLocalizedPath({ path: '/forbidden', locale: locale });
    return NextResponse.rewrite(new URL(forbiddenPath, request.url), {
      status: 403,
      headers: intlResult.intlResponse!.headers
    });
  }

  static createNotFoundPageResponse({ locale, request }: {
    locale: string | null;
    request: NextRequest;
  }): NextResponse {
    const intlResult = this._getIntlResponse(request, locale);
    if (intlResult.redirect) {
      return intlResult.redirect;
    }
    const notFoundPath = this.buildLocalizedPath({ path: '/not-found', locale: locale });
    return NextResponse.rewrite(new URL(notFoundPath, request.url), {
      status: 404,
      headers: intlResult.intlResponse!.headers
    });
  }

  static createSuccessPageResponse({ request, locale }: {
    request: NextRequest;
    locale: string | null;
  }): NextResponse {
    const intlResult = this._getIntlResponse(request, locale);
    if (intlResult.redirect) {
      return intlResult.redirect;
    }
    return intlResult.intlResponse!;
  }

  static createEmailVerificationPageResponse({ locale, request }: {
    locale: string | null;
    request: NextRequest;
  }): NextResponse {
    const intlResult = this._getIntlResponse(request, locale);
    if (intlResult.redirect) {
      return intlResult.redirect;
    }
    const emailVerificationPath = this.buildLocalizedPath({ path: '/auth/verify/email', locale: locale });
    const redirectUrl = `${request.nextUrl.origin}${emailVerificationPath}?redirect=${encodeURIComponent(request.nextUrl.pathname)}`;
    return NextResponse.redirect(redirectUrl, {
      status: 302,
      headers: intlResult.intlResponse!.headers
    });
  }

  static createPhoneVerificationPageResponse({ locale, request }: {
    locale: string | null;
    request: NextRequest;
  }): NextResponse {
    const intlResult = this._getIntlResponse(request, locale);
    if (intlResult.redirect) {
      return intlResult.redirect;
    }
    const phoneVerificationPath = this.buildLocalizedPath({ path: '/auth/verify/phone', locale: locale });
    const redirectUrl = `${request.nextUrl.origin}${phoneVerificationPath}?redirect=${encodeURIComponent(request.nextUrl.pathname)}`;
    return NextResponse.redirect(redirectUrl, {
      status: 302,
      headers: intlResult.intlResponse!.headers
    });
  }

  static createTwoFactorAuthPageResponse({ twoFactorAuthType, request, locale }: {
    twoFactorAuthType: string;
    request: NextRequest;
    locale: string | null;
  }): NextResponse {
    // For page requests, we don't redirect but let the client handle the modal
    const intlResult = this._getIntlResponse(request, locale);
    if (intlResult.redirect) {
      return intlResult.redirect;
    }
    return intlResult.intlResponse!;
  }


  /**
   * Unauthorized API responses
   */
  static createUnauthorizedApiResponse({ type = 'UNAUTHORIZED', message = 'Unauthorized' }: {
    type?: string;
    message?: string;
  } = {}): NextResponse {
    return new NextResponse(
      JSON.stringify({ message, type }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  static createNoTokenResponse(): NextResponse {
    return this.createUnauthorizedApiResponse({
      message: 'Authentication required'
    });
  }

  static createTokenExpiredResponse(): NextResponse {
    return this.createUnauthorizedApiResponse({
      message: 'Session expired'
    });
  }

  static createTokenInvalidResponse(): NextResponse {
    return this.createUnauthorizedApiResponse({
      message: 'Invalid session'
    });
  }

  static createSessionInvalidResponse(): NextResponse {
    return this.createUnauthorizedApiResponse({
      message: 'Session invalid'
    });
  }

  static createForbiddenApiResponse(): NextResponse {
    return new NextResponse(JSON.stringify({ message: 'Forbidden' }), { status: 403 });
  }

  static createNotFoundApiResponse(): NextResponse {
    return new NextResponse(JSON.stringify({ message: 'Endpoint not found' }), { status: 404 });
  }

  static createSuccessApiResponse(): NextResponse {
    return new NextResponse(JSON.stringify({ message: 'Success' }), { status: 200 });
  }

  static createEmailVerificationApiResponse(): NextResponse {
    return new NextResponse(JSON.stringify({ message: 'Email verification required' }), { status: 203 });
  }

  static createPhoneVerificationApiResponse(): NextResponse {
    return new NextResponse(JSON.stringify({ message: 'Phone verification required' }), { status: 202 });
  }

  static createTwoFactorAuthApiResponse({ twoFactorAuthType }: { twoFactorAuthType: string }): NextResponse {
    return new NextResponse(JSON.stringify({ message: 'Two-factor authentication required', type: twoFactorAuthType }), { status: 428 });
  }

  static buildLocalizedPath({ path, locale }: { path: string; locale: string | null }): string {
    // If locale is null/undefined (e.g., for console domain), use default locale
    if (locale === null || locale === undefined || locale === 'undefined') {
      locale = routing.defaultLocale || 'az';
    }
    const validLocale = locale || routing.defaultLocale || 'az';
    return `/${validLocale}${path}`;
  }
}

