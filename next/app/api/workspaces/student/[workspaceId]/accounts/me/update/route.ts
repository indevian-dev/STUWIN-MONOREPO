import { NextRequest } from 'next/server';
import { unifiedApiHandler } from '@/lib/middleware/_Middleware.index';
import { okResponse, errorResponse, serverErrorResponse } from '@/lib/middleware/Response.Api.middleware';

export const PATCH = unifiedApiHandler(async (request: NextRequest, { module, auth, log }) => {
  try {
    const userId = auth.userId;

    const requestBody = await request.json();
    const { user } = requestBody;

    if (!user) {
      return errorResponse('User data is required', 400);
    }

    log.info('Updating account', { userId });

    // Update user profile via AuthService
    const result = await module.auth.updateProfile(userId, {
      firstName: user.name || user.firstName,
      lastName: user.last_name || user.lastName,
      phone: user.phone
    });

    if (!result.success || !result.data) {
      log.error('Error updating user', { error: result.error });
      return errorResponse(result.error || 'Failed to update user', result.status);
    }

    log.info('Account updated', { userId });

    return okResponse({ success: true, user: result.data.user });
  } catch (error) {
    log.error('Error in account update', error instanceof Error ? error : new Error(String(error)));
    return serverErrorResponse('Internal server error');
  }
});
