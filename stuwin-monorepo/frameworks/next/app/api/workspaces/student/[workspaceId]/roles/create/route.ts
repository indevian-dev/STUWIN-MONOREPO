
import { NextRequest, NextResponse } from 'next/server';
import { unifiedApiHandler } from '@/lib/app-access-control/interceptors';

export const POST = unifiedApiHandler(async (request: NextRequest, { module, log }) => {
  try {
    const body = await request.json();
    const { name, permissions } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Role name is required' },
        { status: 400 }
      );
    }

    log.info('Creating role', { name });

    const result = await module.roles.createRole({
      name,
      permissions: Array.isArray(permissions) ? permissions : [],
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to create role' },
        { status: 500 }
      );
    }

    if (result.role) {
      log.info('Role created', { id: result.role.id, name });
      return NextResponse.json({ role: result.role }, { status: 201 });
    }

    return NextResponse.json(
      { error: 'Failed to retrieve created role' },
      { status: 500 }
    );
  } catch (error) {
    log.error('Error in roles create', error as Error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
