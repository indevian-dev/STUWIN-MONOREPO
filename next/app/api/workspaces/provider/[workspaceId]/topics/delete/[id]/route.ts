import type { NextRequest } from "next/server";
import { unifiedApiHandler, type UnifiedContext } from "@/lib/middleware/handlers/ApiInterceptor";
import { errorResponse, serverErrorResponse, messageResponse } from '@/lib/middleware/responses/ApiResponse';

export const DELETE = unifiedApiHandler(
  async (request: NextRequest, { module, params, log }: UnifiedContext) => {
    const topicId = params?.id as string;

    if (!topicId) {
      return errorResponse("Topic ID is required", 400);
    }

    try {
      const result = await module.topic.delete(topicId);

      if (!result.success) {
        return errorResponse(result.error, 404);
      }

      return messageResponse("Topic deleted successfully");
    } catch (error) {
      log.error("Failed to delete topic", error);
      return serverErrorResponse("Failed to delete topic");
    }
  },
);
