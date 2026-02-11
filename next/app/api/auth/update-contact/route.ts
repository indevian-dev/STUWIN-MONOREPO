import { NextRequest, NextResponse } from 'next/server';
import { unifiedApiHandler } from '@/lib/middleware/handlers';

/**
 * PATCH /api/auth/update-contact
 * 
 * Update contact information for unverified users decoupled into AuthService
 */
export const PATCH = unifiedApiHandler(async (request: NextRequest, { authData, module, log }) => {
  if (!authData?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { email, phone } = body;

    // Delegate to AuthService
    const result = await module.auth.updateContactInfo(authData.user.id, {
      email,
      phone
    });

    if (!result.success) {
      if (log) log.warn("Contact update failed", { userId: authData.user.id, error: result.error });
      return NextResponse.json({
        error: result.error,
        field: result.formError ? Object.keys(result.formError)[0] : undefined
      }, { status: result.status });
    }

    return NextResponse.json(result.data, { status: 200 });
  } catch (error) {
    if (log) log.error("Contact update route error", error);
    return NextResponse.json({ error: 'Failed to update contact information' }, { status: 500 });
  }
});
