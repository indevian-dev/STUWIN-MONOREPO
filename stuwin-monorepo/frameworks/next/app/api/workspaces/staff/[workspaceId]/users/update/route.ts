import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { withApiHandler } from '@/lib/app-access-control/interceptors';
import { USERS } from '@/lib/app-infrastructure/database';
import { ValidationService, Rules, Sanitizers } from '@/lib/app-core-modules/services/ValidationService';
import type { ApiRouteHandler, ApiHandlerContext } from '@/types/next';
const updateUserSchema = {
  userId: {
    rules: [Rules.required('userId'), Rules.uuid('userId')],
    sanitizers: [Sanitizers.trim, Sanitizers.lowercase]
  },
  email_is_verified: {
    rules: [],
    sanitizers: [Sanitizers.toBoolean]
  },
  phone_is_verified: {
    rules: [],
    sanitizers: [Sanitizers.toBoolean]
  },
  emailVerified: {
    rules: [],
    sanitizers: [Sanitizers.toBoolean]
  },
  phoneVerified: {
    rules: [],
    sanitizers: [Sanitizers.toBoolean]
  }
};
export const PUT: ApiRouteHandler = withApiHandler(async (request: NextRequest, { authData, log, db }: ApiHandlerContext) => {
  try {
    if (!authData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    // Validate and sanitize input
    const validation = ValidationService.validate(body, updateUserSchema);
    if (!validation.isValid) {
      return NextResponse.json({
        error: 'Validation failed',
        errors: validation.errors.reduce((acc: Record<string, string>, err: any) => {
          acc[err.field] = err.message;
          return acc;
        }, {} as Record<string, string>)
      }, { status: 400 });
    }
    const {
      userId,
      email_is_verified,
      phone_is_verified,
      emailVerified,
      phoneVerified
    } = validation.sanitized as {
      userId: string;
      email_is_verified?: boolean;
      phone_is_verified?: boolean;
      emailVerified?: boolean;
      phoneVerified?: boolean;
    };
    const accountId = authData.account.id;
    const nextEmailVerified = typeof emailVerified === 'boolean'
      ? emailVerified
      : (typeof email_is_verified === 'boolean' ? email_is_verified : undefined);
    const nextPhoneVerified = typeof phoneVerified === 'boolean'
      ? phoneVerified
      : (typeof phone_is_verified === 'boolean' ? phone_is_verified : undefined);
    if (typeof nextEmailVerified === 'undefined' &&
      typeof nextPhoneVerified === 'undefined') {
      return NextResponse.json(
        { error: 'Nothing to update' },
        { status: 400 }
      );
    }
    const userRecordId = userId.includes(':') ? userId : `${USERS}:${userId}`;

    if (typeof nextEmailVerified === 'boolean') {
      await db.query(
        'UPDATE $record SET emailIsVerified = $value, updatedAt = $updatedAt',
        { record: userRecordId, value: nextEmailVerified, updatedAt: new Date() }
      );
    }
    if (typeof nextPhoneVerified === 'boolean') {
      await db.query(
        'UPDATE $record SET phoneIsVerified = $value, updatedAt = $updatedAt',
        { record: userRecordId, value: nextPhoneVerified, updatedAt: new Date() }
      );
    }

    const [user] = await db.query(
      `SELECT id, email, phone, emailIsVerified, phoneIsVerified, updatedAt FROM ${USERS} WHERE id = $record LIMIT 1`,
      { record: userRecordId }
    );

    const result = { user };
    return NextResponse.json({
      success: true,
      user: result.user
    }, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update user verification';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
});
