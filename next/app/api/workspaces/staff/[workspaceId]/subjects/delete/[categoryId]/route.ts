import { NextRequest } from 'next/server';
import { unifiedApiHandler } from '@/lib/middleware/handlers';

import { errorResponse, serverErrorResponse, messageResponse } from '@/lib/middleware/responses/ApiResponse';
export const DELETE = unifiedApiHandler(async (request: NextRequest, { module, params }) => {
  try {
    const { categoryId } = params || {};

    if (!categoryId) {
      return errorResponse("Subject ID (categoryId) is required");
    }

    const result = await module.subject.delete(categoryId);

    if (!result.success) {
      return errorResponse(result.error, 404);
    }

    return messageResponse("Success");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete subject';
    return serverErrorResponse(errorMessage);
  }
});
