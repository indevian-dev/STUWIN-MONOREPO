import { NextRequest, NextResponse } from 'next/server';
import { unifiedApiHandler } from '@/lib/app-access-control/interceptors';

export const GET = unifiedApiHandler(async (request: NextRequest, { module, params }) => {
  try {
    const { id } = params || {};

    if (!id) {
      return NextResponse.json({ error: 'Role ID is required' }, { status: 400 });
    }

    const result = await module.roles.getRole(id);

    if (!result.success) {
      const status = result.status || 500;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({ role: result.role }, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch role';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
});
