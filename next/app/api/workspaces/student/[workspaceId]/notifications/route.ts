import { unifiedApiHandler } from '@/lib/middleware/handlers';
import { okResponse, serverErrorResponse } from '@/lib/middleware/responses/ApiResponse';

export const GET = unifiedApiHandler(async (request, { module, authData, log }) => {
  const accountId = authData.account.id;
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const offset = (page - 1) * limit;

  log.debug('Fetching student notifications', { accountId, page, limit });

  try {
    const result = await module.support.getNotifications(accountId);

    if (!result.success) {
      return serverErrorResponse(result.error);
    }

    const notifications = result.data || [];
    const total = notifications.length; // Basic pagination logic for now as service doesn't support it yet

    // Manual pagination from the full list for now
    const paginatedNotifications = notifications.slice(offset, offset + limit);

    const unreadCount = notifications.filter((n: any) => !n.markAsRead).length;

    return okResponse({ notifications: paginatedNotifications, pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }, unread_count: unreadCount });
  } catch (error) {
    log.error('Failed to fetch student notifications', error as Error);
    return serverErrorResponse('Internal server error');
  }
});
