import { NextResponse } from 'next/server';
import { unifiedApiHandler } from '@/lib/middleware/handlers';

/**
 * GET /api/workspaces/student/[workspaceId]/accounts/me
 * 
 * Fetches student account data with workspace-specific roles and permissions
 * Decoupled into AuthService
 */
export const GET = unifiedApiHandler(async (request, { auth, module, log, params }) => {
  try {
    const accountId = auth.accountId;
    const workspaceId = params.workspaceId as string;

    if (!accountId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    log.debug('Fetching account profile', { accountId, workspaceId });

    // Delegate to AuthService
    const result = await module.auth.getAccountProfile(accountId, workspaceId);

    if (!result.success) {
      log.warn('Failed to fetch account profile', { accountId, error: result.error });
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    log.info('Account profile fetched', { accountId });
    return NextResponse.json(result.data);
  } catch (error) {
    log.error('Error in account profile route', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}, {
  authRequired: true
});
