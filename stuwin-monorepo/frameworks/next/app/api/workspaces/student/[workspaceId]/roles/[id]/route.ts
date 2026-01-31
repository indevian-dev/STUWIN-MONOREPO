
import { NextResponse } from 'next/server';
import { unifiedApiHandler } from '@/lib/app-access-control/interceptors';

export const GET = unifiedApiHandler(async (_request, { module, params, log, isValidSlimId }) => {
  const { id } = params as { id: string };

  if (!id || !isValidSlimId(id)) {
    return NextResponse.json(
      { error: 'Valid role ID is required' },
      { status: 400 }
    );
  }

  log.debug('Fetching role', { id });

  const result = await module.roles.getRole(id);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error || 'Failed to fetch role' },
      { status: result.status || 500 }
    );
  }

  log.info('Role fetched', { id });
  return NextResponse.json({ role: result.role });
});
