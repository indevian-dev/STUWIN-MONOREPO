import { NextRequest, NextResponse } from 'next/server';
import { unifiedApiHandler } from '@/lib/middleware/handlers';
import { z } from 'zod';

const UpdateUserSchema = z.object({
  userId: z.string().uuid("userId must be a valid UUID").trim().toLowerCase(),
  email_is_verified: z.coerce.boolean().optional(),
  phone_is_verified: z.coerce.boolean().optional(),
  emailVerified: z.coerce.boolean().optional(),
  phoneVerified: z.coerce.boolean().optional(),
});

export const PUT = unifiedApiHandler(async (request: NextRequest, { module }) => {
  try {
    const body = await request.json();

    const parsed = UpdateUserSchema.safeParse(body);
    if (!parsed.success) {
      const errors = parsed.error.errors.reduce((acc: Record<string, string>, err) => {
        acc[String(err.path[0] || 'unknown')] = err.message;
        return acc;
      }, {} as Record<string, string>);
      return NextResponse.json({ error: 'Validation failed', errors }, { status: 400 });
    }

    const {
      userId,
      email_is_verified,
      phone_is_verified,
      emailVerified,
      phoneVerified
    } = parsed.data;

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
