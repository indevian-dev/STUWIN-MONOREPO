import { NextRequest } from 'next/server';
import { unifiedApiHandler } from '@/lib/middleware/handlers';

import { okResponse, errorResponse, serverErrorResponse } from '@/lib/middleware/responses/ApiResponse';
export const GET = unifiedApiHandler(async (request: NextRequest, { module, params }) => {
  try {
    const { id: subjectId } = params || {};

    if (!subjectId) {
      return errorResponse("Subject ID is required");
    }

    const result = await module.subject.getById(subjectId);

    if (!result.success) {
      return errorResponse(result.error, 404);
    }

    return okResponse(result.data);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch subject';
    return serverErrorResponse(errorMessage);
  }
});
