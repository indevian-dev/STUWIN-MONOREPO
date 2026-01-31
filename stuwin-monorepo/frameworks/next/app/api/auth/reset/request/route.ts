import { NextRequest, NextResponse } from 'next/server';
import { unifiedApiHandler } from '@/lib/app-access-control/interceptors';

/**
 * POST /api/auth/reset/request
 * 
 * Verification code request endpoint decoupled into AuthService
 */
export const POST = unifiedApiHandler(async (request: NextRequest, { module, log }) => {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, phone, operation = 'verification' } = body || {};

    // Delegate to AuthService
    const result = await module.auth.requestVerificationCode({
      email,
      phone,
      operation
    });

    if (!result.success) {
      if (log) log.warn("Verification request failed", { email, phone, operation, error: result.error });
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json(result.data, { status: 200 });
  } catch (error) {
    if (log) log.error("Verification request route error", error);
    return NextResponse.json({ error: 'Failed to process verification request' }, { status: 500 });
  }
});
