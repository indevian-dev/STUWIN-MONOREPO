import { NextRequest } from 'next/server';
import { unifiedApiHandler } from "@/lib/middleware/_Middleware.index";
import { okResponse, errorResponse } from '@/lib/middleware/Response.Api.middleware';

export const POST = unifiedApiHandler(
  async (request: NextRequest, { module }) => {
    const { topicId, fileName, fileType } = await request.json();

    if (!topicId || !fileName || !fileType) {
      return errorResponse("topicId, fileName, and fileType are required", 400);
    }

    const result = await module.topic.getMediaUploadUrl(topicId, fileName, fileType);

    if (!result.success) {
      return errorResponse(result.error, (result as any).code || 500);
    }

    return okResponse(result.data);
  }
);
