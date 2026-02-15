import { NextRequest } from 'next/server';
import { unifiedApiHandler } from '@/lib/middleware/handlers';

import { okResponse, errorResponse, serverErrorResponse } from '@/lib/middleware/responses/ApiResponse';
export const GET = unifiedApiHandler(async (request: NextRequest, { module, params }) => {
  try {
    const { id } = params || {};

    if (!id) {
      return errorResponse("Role ID is required");
    }

    const result = await module.roles.getRole(id);

    if (!result.success) {
      const status = result.status || 500;
      return errorResponse(result.error, status);
    }

    return okResponse(result.role);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch role';
    return serverErrorResponse(errorMessage);
  }
});
