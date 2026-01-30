import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { withApiHandler } from '@/lib/app-access-control/interceptors';
import type { ApiHandlerContext, ApiRouteHandler } from '@/types/next';
import { workspaceRoles } from '@/lib/app-infrastructure/database/schema';

export const GET: ApiRouteHandler = withApiHandler(async (_request: NextRequest, { db, log }: ApiHandlerContext) => {
  log.debug('Fetching roles');

  try {
    const roles = await db.select().from(workspaceRoles);
    log.info('Roles fetched', { count: roles.length });
    return NextResponse.json({ roles });
  } catch (error) {
    log.error('Error fetching roles', error as Error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'An error occurred' }, { status: 500 });
  }
});
