import type { ApiRouteHandler } from '@/types/next';
import { NextResponse } from 'next/server';
import { withApiHandler } from '@/lib/app-access-control/interceptors';
import { db } from '@/lib/app-infrastructure/database';
import { accountNotifications } from '@/lib/app-infrastructure/database/schema';
import { eq, desc, count, and } from 'drizzle-orm';

/**
 * GET - Fetch account-level notifications for the dashboard
 * This endpoint is shared across all workspaces and fetches notifications
 * specifically for the authenticated account.
 */
export const GET: ApiRouteHandler = withApiHandler(async (request: any, context: any) => {
    const { authData, log } = context;

    if (!authData) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const accountId = authData.account.id;

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '5');
        const offset = (page - 1) * limit;

        // Get notifications with pagination
        const notifications = await db.select({
            id: accountNotifications.id,
            name: accountNotifications.name,
            body: accountNotifications.body,
            markAsRead: accountNotifications.markAsRead,
            createdAt: accountNotifications.createdAt,
            updatedAt: accountNotifications.updatedAt
        })
            .from(accountNotifications)
            .where(eq(accountNotifications.accountId, accountId))
            .orderBy(desc(accountNotifications.createdAt))
            .limit(limit)
            .offset(offset);

        // Get total count
        const totalResult = await db.select({ count: count() })
            .from(accountNotifications)
            .where(eq(accountNotifications.accountId, accountId));

        const total = Number(totalResult[0]?.count || 0);

        // Get unread count
        const unreadResult = await db.select({ count: count() })
            .from(accountNotifications)
            .where(and(
                eq(accountNotifications.accountId, accountId),
                eq(accountNotifications.markAsRead, false)
            ));

        const unreadCount = Number(unreadResult[0]?.count || 0);

        return NextResponse.json({
            notifications,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNext: page < Math.ceil(total / limit),
                hasPrev: page > 1
            },
            unread_count: unreadCount
        });
    } catch (error) {
        if (log) log.error('Failed to fetch dashboard notifications:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
});
