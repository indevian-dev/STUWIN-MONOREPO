import { allEndpoints } from '@/lib/app-route-configs';
import { RouteValidator } from '@/lib/app-access-control/validators/RouteValidator';
import { ResponseResponder } from '@/lib/app-access-control/responders/ResponseResponder';
import { LocalizationService } from '@/i18n/LocalizationService';
import { NextRequest, NextResponse } from 'next/server';
import { CookieAuthenticator } from '@/lib/app-access-control/authenticators/CookieAuthenticator';
import { ConsoleLogger } from '@/lib/app-infrastructure/loggers/ConsoleLogger';
import type { RouteValidation } from '@/types';

export default async function middleware(
  request: NextRequest
): Promise<NextResponse> {


  const endpointValidationResult = RouteValidator.validateEndpoint(request, allEndpoints);

  ConsoleLogger.log(('endpointValidationResult:'), endpointValidationResult);

  if (!endpointValidationResult.isValid || !endpointValidationResult.endpoint) {
    const isApiRequest = request.nextUrl.pathname.startsWith('/api');

    if (isApiRequest) {
      return ResponseResponder.createNotFoundApiResponse();
    } else {
      const requestedLocale = LocalizationService.getLocaleFromRequest(request);
      ConsoleLogger.log(`⛔ Page request validation failed for: ${request.nextUrl.pathname}`);
      return ResponseResponder.createNotFoundPageResponse({
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
      return ResponseResponder.createUnauthorizedApiResponse();
    }

    // Pass through - let withApiHandler do the actual session verification
    return NextResponse.next();

  } catch (error) {
    ConsoleLogger.error(('API middleware error:'), error);
    return ResponseResponder.createInternalServerErrorApiResponse();
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
      return ResponseResponder.createNotFoundPageResponse({
        locale: requestedLocale,
        request
      });
    }

    // Step 2: Check if authentication is required
    if (!endpointValidationResult.endpoint?.authRequired) {
      return ResponseResponder.createSuccessPageResponse({
        locale: requestedLocale,
        request
      });
    }

    // Step 3: Quick session presence check (actual verification in layout validators)
    const { authCookiesData } = CookieAuthenticator.getAuthCookiesFromRequest(request);
    if (!authCookiesData.session) {
      ConsoleLogger.log(('⛔ No session - unauthorized'));
      return ResponseResponder.createUnauthorizedPageResponse({
        locale: requestedLocale,
        request
      });
    }

    // Pass through - let layout validators do the actual session verification
    return ResponseResponder.createSuccessPageResponse({
      locale: requestedLocale,
      request
    });

  } catch (error) {
    ConsoleLogger.error(('Page middleware error:'), error);
    return ResponseResponder.createUnauthorizedPageResponse({
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

