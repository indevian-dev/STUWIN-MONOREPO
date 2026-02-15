
import { NextRequest } from 'next/server';
import { unifiedApiHandler } from '@/lib/middleware/handlers';
import { createdResponse, errorResponse, serverErrorResponse } from '@/lib/middleware/responses/ApiResponse';

export const POST = unifiedApiHandler(async (request: NextRequest, { module, log }) => {
  try {
    const body = await request.json();
    const { name, permissions } = body;

    if (!name) {
      return errorResponse('Role name is required', 400);
    }

    log.info('Creating role', { name });

    const result = await module.roles.createRole({
      name,
      permissions: Array.isArray(permissions) ? permissions : [],
    });

    if (!result.success) {
      return serverErrorResponse(result.error || 'Failed to create role');
    }

    if (result.role) {
      log.info('Role created', { id: result.role.id, name });
      return createdResponse(result.role);
    }

    return serverErrorResponse('Failed to retrieve created role');
  } catch (error) {
    log.error('Error in roles create', error as Error);
    return serverErrorResponse('Internal server error');
  }
});
