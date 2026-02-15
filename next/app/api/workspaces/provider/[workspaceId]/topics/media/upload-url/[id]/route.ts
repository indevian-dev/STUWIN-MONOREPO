import { NextRequest } from 'next/server';
import { unifiedApiHandler } from "@/lib/middleware/handlers";
import { okResponse, errorResponse } from '@/lib/middleware/responses/ApiResponse';

export const POST = unifiedApiHandler(
  async (request: NextRequest, { module, params }) => {
    const { id: topicId } = params ?? {};
    if (!topicId) {
      return errorResponse("Valid topic ID is required", 400);
    }

    const { fileName, fileType } = await request.json();
    const result = await module.topic.getMediaUploadUrl(topicId, fileName, fileType);

    if (!result.success) {
      return errorResponse(result.error, (result as any).code || 500);
    }

    return okResponse(result.data);
  }
);
