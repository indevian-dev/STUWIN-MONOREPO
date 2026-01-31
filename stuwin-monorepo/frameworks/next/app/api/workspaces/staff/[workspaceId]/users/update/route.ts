import { NextRequest, NextResponse } from 'next/server';
import { unifiedApiHandler } from '@/lib/app-access-control/interceptors';
import { ValidationService, Rules, Sanitizers } from '@/lib/app-core-modules/services/ValidationService';

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

export const PUT = unifiedApiHandler(async (request: NextRequest, { module }) => {
  try {
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

    const nextEmailVerified = typeof emailVerified === 'boolean'
      ? emailVerified
      : (typeof email_is_verified === 'boolean' ? email_is_verified : undefined);
    const nextPhoneVerified = typeof phoneVerified === 'boolean'
      ? phoneVerified
      : (typeof phone_is_verified === 'boolean' ? phone_is_verified : undefined);

    if (typeof nextEmailVerified === 'undefined' && typeof nextPhoneVerified === 'undefined') {
      return NextResponse.json(
        { error: 'Nothing to update' },
        { status: 400 }
      );
    }

    const result = await module.auth.updateUserVerification(userId, {
      emailVerified: nextEmailVerified,
      phoneVerified: nextPhoneVerified
    });

    if (!result.success) {
      const status = result.status || 500;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({
      success: true,
      user: result.user
    }, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update user verification';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
});
