import type { NextRequest } from 'next/server';
import type { ApiRouteHandler, ApiHandlerContext } from '@/types/next';
import { NextResponse } from 'next/server';
import { withApiHandler } from '@/lib/app-access-control/interceptors';
import { ROLES } from '@/lib/app-infrastructure/database';
export const GET: ApiRouteHandler = withApiHandler(async (request: NextRequest, { authData, log, db }: ApiHandlerContext) => {
  try {
    const { searchParams } = new URL(request.url);
    const sortBy = searchParams.get('sortBy') || 'name';
    const order = searchParams.get('order') || 'asc';
    // Get roles with proper column mapping
    const validColumns = new Set(['id', 'name', 'createdAt', 'version', 'type']);
    const sortColumn = validColumns.has(sortBy) ? sortBy : 'name';
    const orderDirection = order === 'desc' ? 'DESC' : 'ASC';

    const result = await db.query(`
      SELECT id, createdAt, name, permissions, version, type
      FROM ${ROLES}
      ORDER BY ${sortColumn} ${orderDirection}
    `);
    if (!result || !Array.isArray(result)) {
      return NextResponse.json({
        roles: [],
        message: "No data or invalid format returned"
      }, { status: 200 });
    }
    // TODO: Implement audit logging
    // await db.insert(actionLogs).values({
    //   action: 'list',
    //   resourceType: 'roles',
    // });
    return NextResponse.json({
      roles: result,
      count: result.length,
      message: result.length === 0 ? "No roles found" : undefined
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to fetch roles';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
});
