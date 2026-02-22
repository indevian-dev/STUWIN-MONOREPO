import { NextRequest } from 'next/server';
import { unifiedApiHandler } from '@/lib/middleware/_Middleware.index';

import { createdResponse, errorResponse, serverErrorResponse } from '@/lib/middleware/Response.Api.middleware';
export const POST = unifiedApiHandler(async (request: NextRequest, { module }) => {
  try {
    const body = await request.json();
    const { name, permissions, forWorkspaceType } = body;

    if (!name) {
      return errorResponse("Role name is required");
    }

    const result = await module.roles.createRole({
      name,
      permissions: Array.isArray(permissions) ? permissions : [],
      forWorkspaceType
    });

    if (!result.success) {
      // If status is 404 it might be related to validation or conflict, but generic error mainly
      return serverErrorResponse(result.error);
    }

    return createdResponse(result.role);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create role';
    return serverErrorResponse(errorMessage);
  }
});
