import { NextRequest, NextResponse } from 'next/server';
import { unifiedApiHandler } from '@/lib/app-access-control/interceptors';

export const POST = unifiedApiHandler(async (request: NextRequest, { module, params }) => {
  try {
    const { id } = params || {};
    if (!id) {
      return NextResponse.json({ error: 'Role ID is required' }, { status: 400 });
    }

    const { permission, action } = await request.json();
    if (!permission || !action) {
      return NextResponse.json({ error: 'Permission and action are required' }, { status: 400 });
    }
    if (action !== 'add' && action !== 'remove') {
      return NextResponse.json({ error: 'Action must be "add" or "remove"' }, { status: 400 });
    }

    const result = await module.roles.updateRolePermissions(id, permission, action);

    if (!result.success) {
      const status = result.status || 500;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({
      role: result.role,
      action: action === "add" ? "added" : "removed",
      permission
    }, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update permissions';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
});
