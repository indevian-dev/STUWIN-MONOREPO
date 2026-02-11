
import { NextResponse } from 'next/server';
import { unifiedApiHandler } from '@/lib/middleware/handlers';

export const GET = unifiedApiHandler(async (_request, { module, log }) => {
  log.debug('Fetching roles');

  const result = await module.roles.getAllRoles();

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  log.info('Roles fetched', { count: result.roles?.length });
  return NextResponse.json({ roles: result.roles });
});
