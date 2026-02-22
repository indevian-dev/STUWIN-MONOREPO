import { allEndpoints } from '@/lib/routes/_Routes.index';
import { RouteValidator } from '@/lib/middleware/Validator.Route.middleware';
import { EdgeGuard } from '@/lib/middleware/Guard.EdgeResponse.middleware';
import { LocalizationService } from '@/i18n/Localization.service';
import { NextRequest, NextResponse } from 'next/server';
import { CookieAuthenticator } from '@/lib/middleware/Authenticator.Cookie.middleware';
import { ConsoleLogger } from '@/lib/logging/Console.logger';
import type { RouteValidation } from '@/lib/routes/Route.types';

export default async function middleware(
  request: NextRequest
): Promise<NextResponse> {


  const endpointValidationResult = RouteValidator.validateEndpoint(request, allEndpoints);

  ConsoleLogger.log(('endpointValidationResult:'), endpointValidationResult);

  if (!endpointValidationResult.isValid || !endpointValidationResult.endpoint) {
    const isApiRequest = request.nextUrl.pathname.startsWith('/api');

    if (isApiRequest) {
      return EdgeGuard.createNotFoundApiResponse();
    } else {
      const requestedLocale = LocalizationService.getLocaleFromRequest(request);
      ConsoleLogger.log(`⛔ Page request validation failed for: ${request.nextUrl.pathname}`);
      return EdgeGuard.createNotFoundPageResponse({
        locale: requestedLocale,
        request
      });
    }
  }

  if (endpointValidationResult.endpoint.type === 'api') {
    return handleApiRequest(request, endpointValidationResult);
  } else {
    return handlePageRequest(request, endpointValidationResult);
  }
}

function handleApiRequest(
  request: NextRequest,
  endpointValidationResult: RouteValidation
): NextResponse {
  try {
    // Step 2: Check if authentication is required
    // If not, return next
    if (!endpointValidationResult.endpoint?.authRequired) {
      return NextResponse.next();
    }

    // Step 3: Quick session presence check (actual verification in withApiHandler)
    const { authCookiesData } = CookieAuthenticator.getAuthCookiesFromRequest(request);
    if (!authCookiesData.session) {
      ConsoleLogger.error(('⛔ No session - unauthorized'));
      return EdgeGuard.createUnauthorizedApiResponse();
    }

    // Pass through - let withApiHandler do the actual session verification
    return NextResponse.next();

  } catch (error) {
    ConsoleLogger.error(('API middleware error:'), error);
    return EdgeGuard.createInternalServerErrorApiResponse();
  }
}

function handlePageRequest(
  request: NextRequest,
  endpointValidationResult: RouteValidation
): NextResponse {
  // Extract locale from pathname for dashboard/base pages
  const requestedLocale: string = LocalizationService.getLocaleFromRequest(request);

  try {


    if (!endpointValidationResult.isValid || !endpointValidationResult.endpoint) {
      ConsoleLogger.log(('⛔ Page request validation failed:'), endpointValidationResult);
      return EdgeGuard.createNotFoundPageResponse({
        locale: requestedLocale,
        request
      });
    }

    // Step 2: Check if authentication is required
    if (!endpointValidationResult.endpoint?.authRequired) {
      return EdgeGuard.createSuccessPageResponse({
        locale: requestedLocale,
        request
      });
    }

    // Step 3: Quick session presence check (actual verification in layout validators)
    const { authCookiesData } = CookieAuthenticator.getAuthCookiesFromRequest(request);
    if (!authCookiesData.session) {
      ConsoleLogger.log(('⛔ No session - unauthorized'));
      return EdgeGuard.createUnauthorizedPageResponse({
        locale: requestedLocale,
        request
      });
    }

    // Pass through - let layout validators do the actual session verification
    return EdgeGuard.createSuccessPageResponse({
      locale: requestedLocale,
      request
    });

  } catch (error) {
    ConsoleLogger.error(('Page middleware error:'), error);
    return EdgeGuard.createUnauthorizedPageResponse({
      locale: requestedLocale,
      request
    });
  }
}

export const config = {
  matcher: [
    '/((?!_next|_vercel|public|.*\\.(?:.*)).*)',
  ],
};

