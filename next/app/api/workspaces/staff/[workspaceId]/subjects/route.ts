import { NextRequest } from 'next/server';
import { unifiedApiHandler } from '@/lib/middleware/handlers';

import { okResponse, errorResponse, serverErrorResponse } from '@/lib/middleware/responses/ApiResponse';
export const GET = unifiedApiHandler(async (request: NextRequest, { module }) => {
  try {
    const result = await module.subject.getPublicSubjects();

    if (!result.success) {
      return errorResponse(result.error, 400);
    }

    return okResponse(result.data);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch subjects';
    return serverErrorResponse(errorMessage);
  }
});
