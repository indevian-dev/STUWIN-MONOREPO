import { NextRequest, NextResponse } from 'next/server';
import { unifiedApiHandler } from '@/lib/app-access-control/interceptors';

export const PATCH = unifiedApiHandler(async (request: NextRequest, { module, auth, log }) => {
  try {
    const userId = auth.userId;

    const requestBody = await request.json();
    const { user } = requestBody;

    if (!user) {
      return NextResponse.json(
        { error: 'User data is required' },
        { status: 400 }
      );
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
      return NextResponse.json(
        { error: result.error || 'Failed to update user' },
        { status: result.status || 500 }
      );
    }

    log.info('Account updated', { userId });

    return NextResponse.json({
      success: true,
      user: result.data.user
    });
  } catch (error) {
    log.error('Error in account update', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
