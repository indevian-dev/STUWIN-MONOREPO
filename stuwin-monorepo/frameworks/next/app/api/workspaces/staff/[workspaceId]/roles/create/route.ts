import { NextRequest, NextResponse } from 'next/server';
import { unifiedApiHandler } from '@/lib/app-access-control/interceptors';

export const POST = unifiedApiHandler(async (request: NextRequest, { module }) => {
  try {
    const body = await request.json();
    const { name, permissions, forWorkspaceType } = body;

    if (!name) {
      return NextResponse.json({ error: 'Role name is required' }, { status: 400 });
    }

    const result = await module.roles.createRole({
      name,
      permissions: Array.isArray(permissions) ? permissions : [],
      forWorkspaceType
    });

    if (!result.success) {
      // If status is 404 it might be related to validation or conflict, but generic error mainly
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ role: result.role }, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create role';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
});
