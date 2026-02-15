import { NextRequest } from 'next/server';
import { unifiedApiHandler } from '@/lib/middleware/handlers';
import { okResponse, errorResponse, serverErrorResponse } from '@/lib/middleware/responses/ApiResponse';

export const POST = unifiedApiHandler(async (request: NextRequest, { module, params }) => {
  try {
    const { id } = params || {};
    if (!id) {
      return errorResponse("Role ID is required");
    }

    const { permission, action } = await request.json();
    if (!permission || !action) {
      return errorResponse("Permission and action are required");
    }
    if (action !== 'add' && action !== 'remove') {
      return errorResponse('Action must be "add" or "remove"');
    }

    const result = await module.roles.updateRolePermissions(id, permission, action);

    if (!result.success) {
      const status = result.status || 500;
      return errorResponse(result.error, status);
    }

    return okResponse(result.role);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update permissions';
    return serverErrorResponse(errorMessage);
  }
});
