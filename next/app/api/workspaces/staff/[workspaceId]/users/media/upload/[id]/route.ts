import type { NextRequest } from 'next/server';
import { unifiedApiHandler } from '@/lib/middleware/_Middleware.index';

import { okResponse, errorResponse } from '@/lib/middleware/Response.Api.middleware';
export const POST = unifiedApiHandler(async (request: NextRequest, { params, module }) => {
  const { id } = await params;
  if (!id) {
    return errorResponse("User ID is required");
  }

  const body = await request.json();
  const { fileType, fileName } = body;

  const result = await module.workspace.getUserMediaUploadUrl(id, fileName, fileType);

  if (!result.success) {
    return errorResponse(result.error, (result as any).code || 500);
  }

  return okResponse(result.data);
});
