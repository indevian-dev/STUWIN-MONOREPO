import { unifiedApiHandler } from '@/lib/middleware/_Middleware.index';
import { okResponse, errorResponse, serverErrorResponse } from '@/lib/middleware/Response.Api.middleware';

export const PATCH = unifiedApiHandler(async (request, { module, params, log, isValidSlimId }) => {
  const { id } = params as { id: string };

  if (!id || !isValidSlimId(id)) {
    return errorResponse('Valid notification ID is required', 400);
  }

  try {
    const { mark_as_read } = await request.json();

    // The service currently only marks as read, doesn't take the boolean value to toggle.
    // If we need to support toggling, we might need to update the service.
    // But usually notifications are only marked as read.
    const result = await module.support.markAsRead(id);

    if (!result.success) {
      return serverErrorResponse(result.error);
    }

    return okResponse({ success: true, notification: result.data?.[0] });
  } catch (error) {
    log.error('Failed to update student notification', error as Error);
    return serverErrorResponse('Internal server error');
  }
});
