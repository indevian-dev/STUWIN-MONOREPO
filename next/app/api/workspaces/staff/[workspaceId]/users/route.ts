import { NextRequest } from 'next/server';
import { unifiedApiHandler } from '@/lib/middleware/_Middleware.index';

import { okResponse, serverErrorResponse } from '@/lib/middleware/Response.Api.middleware';
export const GET = unifiedApiHandler(async (request: NextRequest, { module }) => {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');

    const result = await module.auth.listUsers(page, pageSize);

    if (!result.success) {
      return serverErrorResponse(result.error);
    }

    return okResponse(result.data);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch users';
    return serverErrorResponse(errorMessage);
  }
});
