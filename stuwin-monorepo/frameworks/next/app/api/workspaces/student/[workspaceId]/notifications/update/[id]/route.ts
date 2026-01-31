import { NextResponse } from 'next/server';
import { unifiedApiHandler } from '@/lib/app-access-control/interceptors';

export const PATCH = unifiedApiHandler(async (request, { module, params, log, isValidSlimId }) => {
  const { id } = params as { id: string };

  if (!id || !isValidSlimId(id)) {
    return NextResponse.json(
      { error: 'Valid notification ID is required' },
      { status: 400 }
    );
  }

  try {
    const { mark_as_read } = await request.json();

    // The service currently only marks as read, doesn't take the boolean value to toggle.
    // If we need to support toggling, we might need to update the service.
    // But usually notifications are only marked as read.
    const result = await module.support.markAsRead(id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      notification: result.data?.[0]
    });
  } catch (error) {
    log.error('Failed to update student notification', error as Error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
