import { NextRequest, NextResponse } from 'next/server';
import { unifiedApiHandler } from '@/lib/app-access-control/interceptors';

/**
 * POST /api/auth/reset/set
 * 
 * Password reset completion endpoint decoupled into AuthService
 */
export const POST = unifiedApiHandler(async (request: NextRequest, { module, log }) => {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, password, confirmPassword, otp } = body;

    // Delegate to AuthService
    const result = await module.auth.verifyAndResetPassword({
      email,
      password,
      confirmPassword,
      otp
    });

    if (!result.success) {
      if (log) log.warn("Password reset failed", { email, error: result.error });
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json(result.data, { status: 200 });
  } catch (error) {
    if (log) log.error("Password reset route error", error);
    return NextResponse.json({ error: 'An error occurred while processing your request' }, { status: 500 });
  }
});
