
import { NextRequest, NextResponse } from 'next/server';
import { unifiedApiHandler } from '@/lib/app-access-control/interceptors';

export const POST = unifiedApiHandler(async (request: NextRequest, { module, params, log }) => {
  try {
    const { id } = params as { id: string };
    const { action, permission, path } = await request.json();

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

    const result = await module.roles.updateRolePermissions(id, permissionValue, action);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to update permissions' },
        { status: result.status || 500 }
      );
    }

    log.info('Permissions updated', { id, permission: permissionValue, action });
    return NextResponse.json({
      role: result.role,
      action: action === 'add' ? 'added' : 'removed',
      permission: permissionValue
    }, { status: 200 });

  } catch (error) {
    log.error('Error updating permissions', error as Error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
