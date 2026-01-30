import type { NextRequest } from 'next/server';
import type { ApiRouteHandler, ApiHandlerContext } from '@/types/next';
import { NextResponse } from 'next/server';
import { withApiHandler } from '@/lib/app-access-control/interceptors';

export const PATCH: ApiRouteHandler = withApiHandler(async (request: NextRequest, { authData, log, db }: ApiHandlerContext) => {
  try {
    if (!authData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accountId = authData.account.id;
    const userId = authData.user.id;

    const requestBody = await request.json();
    const { user } = requestBody;

    if (!user) {
      return NextResponse.json(
        { error: 'User data is required' },
        { status: 400 }
      );
    }

    log.info('Updating account', { accountId, userId });

    // Update user data
    const updateResult = await db.query(
      'UPDATE users SET name = $name, lastName = $lastName, phone = $phone, avatarBase64 = $avatarBase64, updatedAt = $updatedAt WHERE id = $userId RETURN AFTER',
      {
        name: user.name,
        lastName: user.last_name,
        phone: user.phone,
        avatarBase64: user.avatar_base64,
        updatedAt: new Date().toISOString(),
        userId
      }
    );
    const updatedUser = updateResult[0];

    if (!updatedUser) {
      log.error('Error updating user - not found');
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Fetch updated account
    const accountResult = await db.query(
      'SELECT * FROM accounts WHERE id = $accountId LIMIT 1',
      { accountId }
    );
    const account = accountResult[0];

    log.info('Account updated', { accountId });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        last_name: updatedUser.lastName,
        email: updatedUser.email,
        phone: updatedUser.phone,
        avatar_base64: updatedUser.avatarBase64
      },
      account
    });
  } catch (error) {
    log.error('Error in account update', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
