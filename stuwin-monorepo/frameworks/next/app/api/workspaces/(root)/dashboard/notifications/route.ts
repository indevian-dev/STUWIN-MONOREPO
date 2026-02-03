import { NextRequest, NextResponse } from 'next/server';
import { unifiedApiHandler } from '@/lib/app-access-control/interceptors';

/**
 * GET - Fetch account-level notifications for the dashboard
 * This endpoint is shared across all workspaces and fetches notifications
 * specifically for the authenticated account.
 */
export const GET = unifiedApiHandler(async (request: NextRequest, { authData, module }) => {
    if (!authData?.account?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '5');

    const result = await module.support.getNotificationsContext({
        accountId: authData.account.id,
        page,
        limit
    });

    if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result.data);
});
