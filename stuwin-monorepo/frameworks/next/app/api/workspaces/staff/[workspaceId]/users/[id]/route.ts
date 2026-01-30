import type { NextRequest } from 'next/server';
import type { ApiRouteHandler, ApiHandlerContext } from '@/types/next';
import { NextResponse } from 'next/server';
import { withApiHandler } from '@/lib/app-access-control/interceptors';
import { USERS, ACCOUNTS } from '@/lib/app-infrastructure/database';
export const GET: ApiRouteHandler = withApiHandler(async (request: NextRequest, { authData, params, log, db }: ApiHandlerContext) => {
  try {
    if (!params) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    const { id: userId } = await params;
    const normalizedUserId = userId?.includes(':') ? userId : `${USERS}:${userId}`;
    // Get user
    const [user] = await db.query(
      `SELECT * FROM ${USERS} WHERE id = $userId LIMIT 1`,
      { userId: normalizedUserId }
    );
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    // Get user's accounts
    const userAccounts = await db.query(
      `SELECT * FROM ${ACCOUNTS} WHERE userId = $userId`,
      { userId: normalizedUserId }
    );
    // Attach accounts to user
    const userWithAccounts = {
      ...user,
      accounts: userAccounts
    };
    return NextResponse.json({ user: userWithAccounts });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch user';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
});
