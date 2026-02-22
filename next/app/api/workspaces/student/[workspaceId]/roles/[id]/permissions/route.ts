
import { NextRequest } from 'next/server';
import { unifiedApiHandler } from '@/lib/middleware/_Middleware.index';
import { okResponse, errorResponse, serverErrorResponse } from '@/lib/middleware/Response.Api.middleware';

export const POST = unifiedApiHandler(async (request: NextRequest, { module, params, log }) => {
  try {
    const { id } = params as { id: string };
    const { action, permission, path } = await request.json();

    const permissionValue = permission || path;

    if (!permissionValue || !action) {
      return errorResponse('Permission (or path) and action are required', 400);
    }

    if (action !== 'add' && action !== 'remove') {
      return errorResponse('Action must be "add" or "remove"', 400);
    }

    log.info('Updating role permissions', { id, permission: permissionValue, action });

    const result = await module.roles.updateRolePermissions(id, permissionValue, action);

    if (!result.success) {
      return errorResponse(result.error || 'Failed to update permissions', result.status);
    }

    log.info('Permissions updated', { id, permission: permissionValue, action });
    return okResponse({ role: result.role, action: action === 'add' ? 'added' : 'removed', permission: permissionValue });

  } catch (error) {
    log.error('Error updating permissions', error as Error);
    return serverErrorResponse('Internal server error');
  }
});
