import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { withApiHandler } from '@/lib/app-access-control/interceptors';
import type { ApiHandlerContext, ApiRouteHandler } from '@/types/next';
import { workspaceRoles } from '@/lib/app-infrastructure/database/schema';
import { eq } from 'drizzle-orm';

export const GET: ApiRouteHandler = withApiHandler(async (request: NextRequest, { authData, db, params, log, isValidSlimId }: ApiHandlerContext) => {
  const resolvedParams = await params;
  const { id } = resolvedParams as { id: string };

  if (!id || !isValidSlimId || !isValidSlimId(id)) {
    return NextResponse.json(
      { error: 'Valid role ID is required' },
      { status: 400 }
    );
  }

  log.debug('Fetching role', { id });

  try {
    const roleResult = await db
      .select()
      .from(workspaceRoles)
      .where(eq(workspaceRoles.id, id))
      .limit(1);

    const role = roleResult[0];

    if (!role) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      );
    }

    log.info('Role fetched', { id });
    return NextResponse.json({ role });
  } catch (error) {
    log.error('Error fetching role', error as Error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred' },
      { status: 500 }
    );
  }
});
