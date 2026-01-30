import type { NextRequest } from 'next/server';
import type { ApiRouteHandler, ApiHandlerContext } from '@/types/next';
import { NextResponse } from 'next/server';
import { withApiHandler } from '@/lib/app-access-control/interceptors';
import { workspaceRoles } from '@/lib/app-infrastructure/database/schema';
import { eq } from 'drizzle-orm';

export const POST: ApiRouteHandler = withApiHandler(async (request: NextRequest, { authData, params, log, db }: ApiHandlerContext) => {
  const resolvedParams = await params;
  const { id } = resolvedParams as { id: string };
  const { path, method, action, permission } = await request.json();

  const permissionValue = permission || path;

  if (!permissionValue || !action) {
    return NextResponse.json(
      { error: 'Permission (or path) and action are required' },
      { status: 400 }
    );
  }

  if (action !== 'add' && action !== 'remove') {
    return NextResponse.json(
      { error: 'Action must be "add" or "remove"' },
      { status: 400 }
    );
  }

  log.info('Updating role permissions', { id, permission: permissionValue, action });

  try {
    // Get current role
    const [role] = await db
      .select({ permissions: workspaceRoles.permissions })
      .from(workspaceRoles)
      .where(eq(workspaceRoles.id, id))
      .limit(1);

    if (!role) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      );
    }

    let permissions = Array.isArray(role.permissions) ? (role.permissions as string[]) : [];

    if (action === 'add') {
      if (!permissions.includes(permissionValue)) {
        permissions.push(permissionValue);
      }
    } else {
      permissions = permissions.filter((item: string) => item !== permissionValue);
    }

    // Update permissions
    const [updated] = await db
      .update(workspaceRoles)
      .set({ permissions: permissions })
      .where(eq(workspaceRoles.id, id))
      .returning();

    log.info('Permissions updated', { id, permission: permissionValue, action });
    return NextResponse.json({
      role: updated,
      action: action === 'add' ? 'added' : 'removed',
      permission: permissionValue
    }, { status: 200 });

  } catch (error) {
    log.error('Error updating permissions', error as Error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred' },
      { status: 500 }
    );
  }
});
