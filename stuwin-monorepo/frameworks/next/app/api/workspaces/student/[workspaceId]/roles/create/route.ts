import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { withApiHandler } from '@/lib/app-access-control/interceptors';
import type { ApiHandlerContext, ApiRouteHandler } from '@/types/next';
import { workspaceRoles } from '@/lib/app-infrastructure/database/schema';

export const POST: ApiRouteHandler = withApiHandler(async (request: NextRequest, { authData, log, db, generateSlimId }: ApiHandlerContext) => {
  try {
    const body = await request.json();
    const { name, description, permissions } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Role name is required' },
        { status: 400 }
      );
    }

    log.info('Creating role', { name });

    const [role] = await db
      .insert(workspaceRoles)
      .values({
        id: generateSlimId ? generateSlimId() : undefined,
        name,
        permissions: Array.isArray(permissions) ? permissions : [],
      })
      .returning();

    log.info('Role created', { id: role.id, name });
    return NextResponse.json({ role }, { status: 201 });
  } catch (error) {
    log.error('Error in roles create', error as Error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
