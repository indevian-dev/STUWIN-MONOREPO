import type { ApiRouteHandler, ApiHandlerContext } from '@/types/next';
import { NextRequest, NextResponse } from 'next/server';
import { withApiHandler } from '@/lib/app-access-control/interceptors';
import argon2 from 'argon2';
import { getValidOtp, consumeOtp } from '@/lib/utils/otpHandlingUtility';
import { users, accounts, userCredentials } from '@/lib/app-infrastructure/database/schema';
import { eq, and } from 'drizzle-orm';
import { ConsoleLogger } from '@/lib/app-infrastructure/loggers/ConsoleLogger';

export const POST: ApiRouteHandler = withApiHandler(async (request: NextRequest, { log, db }: ApiHandlerContext) => {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, password, confirmPassword, otp } = body;

    if (!email || !password || !confirmPassword || !otp) {
      return NextResponse.json(
        { error: 'Email, password, confirmPassword, and OTP are required' },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    if (!/\d/.test(password)) {
      return NextResponse.json(
        { error: 'Password must contain at least one number' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find user and their account
    const userResult = await db
      .select({
        userId: users.id,
        accountId: accounts.id
      })
      .from(users)
      .leftJoin(accounts, eq(users.id, accounts.userId))
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (!userResult.length) {
      return NextResponse.json(
        { error: 'Invalid email or OTP' },
        { status: 400 }
      );
    }

    const user = userResult[0];

    if (!user.accountId) {
      return NextResponse.json({ error: 'Account not found for this user' }, { status: 400 });
    }

    // Check OTP validity with destination check
    const validOtp = await getValidOtp({
      accountId: user.accountId,
      type: 'password_reset' as any,
      code: otp,
      destination: normalizedEmail,
      client: db as any
    });

    if (!validOtp) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP' },
        { status: 400 }
      );
    }

    // Hash the password
    const hashedPassword = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 16384,
      timeCost: 3,
      parallelism: 2
    });

    // Update user password in userCredentials table
    await db
      .update(userCredentials)
      .set({
        password: hashedPassword,
        updatedAt: new Date()
      })
      .where(eq(userCredentials.id, user.userId));

    // Consume the OTP
    await consumeOtp({ otpId: validOtp.id, client: db as any });

    return NextResponse.json(
      {
        success: true,
        message: 'Password has been reset successfully'
      },
      { status: 200 }
    );
  } catch (error) {
    ConsoleLogger.error('Password reset error:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
});



