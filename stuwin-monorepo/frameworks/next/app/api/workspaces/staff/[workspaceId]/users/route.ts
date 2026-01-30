import type { NextRequest } from 'next/server';
import type { ApiRouteHandler, ApiHandlerContext } from '@/types/next';
import { NextResponse } from 'next/server';
import { withApiHandler } from '@/lib/app-access-control/interceptors';
export const GET: ApiRouteHandler = withApiHandler(async (request: NextRequest, { authData, log, db }: ApiHandlerContext) => {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const offset = (page - 1) * pageSize;

    // Get users
    const usersResult = await db.query(
      'SELECT * FROM users LIMIT $limit START $offset',
      { limit: pageSize, offset: offset }
    );

    // Get accounts for these users
    const userIds = usersResult.map((u: any) => u.id);
    let accountsResult: any[] = [];

    if (userIds.length > 0) {
      accountsResult = await db.query(
        'SELECT * FROM accounts WHERE user IN $userIds',
        { userIds }
      );
    }

    // Group accounts by user
    const accountsByUser = accountsResult.reduce((acc: any, account: any) => {
      const userId = account.user;
      if (!acc[userId]) acc[userId] = [];
      acc[userId].push(account);
      return acc;
    }, {});

    // Attach accounts to users
    const usersWithAccounts = usersResult.map((user: any) => ({
      ...user,
      accounts: accountsByUser[user.id] || []
    }));

    // Get total count
    const countResult = await db.query('SELECT count() FROM users');
    const total = countResult[0]?.count || 0;

    return NextResponse.json({
      users: usersWithAccounts,
      total,
      page,
      pageSize
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch users';
    return NextResponse.json({
      error: errorMessage
    }, { status: 500 });
  }
});
