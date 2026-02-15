import { NextRequest } from 'next/server';
import { unifiedApiHandler } from '@/lib/middleware/handlers';
import { okResponse, serverErrorResponse } from '@/lib/middleware/responses/ApiResponse';
export const GET = unifiedApiHandler(async (request: NextRequest, { module }) => {
  try {
    const result = await module.roles.getAllRoles();

    if (!result.success) {
      return serverErrorResponse(result.error);
    }

    return okResponse(result.roles);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch roles';
    return serverErrorResponse(errorMessage);
  }
});
