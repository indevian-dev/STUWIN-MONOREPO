import { NextRequest } from 'next/server';
import { unifiedApiHandler } from '@/lib/middleware/_Middleware.index';
import { okResponse, errorResponse, serverErrorResponse } from '@/lib/middleware/Response.Api.middleware';

/**
 * PATCH /api/auth/update-contact
 * 
 * Update contact information for unverified users decoupled into AuthService
 */
export const PATCH = unifiedApiHandler(async (request: NextRequest, { authData, module, log }) => {
  if (!authData?.user?.id) {
    return errorResponse('Unauthorized', 401, "UNAUTHORIZED");
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { email, phone } = body;

    // Delegate to AuthService
    const result = await module.auth.updateContactInfo(authData.user.id, {
      email,
      phone
    });

    if (!result.success) {
      if (log) log.warn("Contact update failed", { userId: authData.user.id, error: result.error });
      return errorResponse(result.error, result.status);
    }

    return okResponse(result.data);
  } catch (error) {
    if (log) log.error("Contact update route error", error);
    return serverErrorResponse('Failed to update contact information');
  }
});
