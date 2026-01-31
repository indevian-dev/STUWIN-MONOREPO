import { NextRequest, NextResponse } from 'next/server';
import { unifiedApiHandler } from '@/lib/app-access-control/interceptors';

export const GET = unifiedApiHandler(async (request: NextRequest, { module }) => {
  try {
    const result = await module.roles.getAllRoles();

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      roles: result.roles,
      count: result.roles?.length || 0,
      message: result.roles?.length === 0 ? "No roles found" : undefined
    }, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch roles';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
});
