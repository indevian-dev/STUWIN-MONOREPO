import type { NextRequest } from "next/server";
import { unifiedApiHandler } from "@/lib/middleware/_Middleware.index";
import { okResponse, errorResponse, serverErrorResponse } from '@/lib/middleware/Response.Api.middleware';

export const POST = unifiedApiHandler(
  async (request: NextRequest, { authData, module }) => {
    // Optional API key check for queue service
    const queueApiKey = process.env.QUEUE_API_KEY;
    if (queueApiKey) {
      const providedKey = request.headers.get("x-api-key");
      if (providedKey !== queueApiKey) {
        return errorResponse("Invalid API key", 401, "UNAUTHORIZED");
      }
    }

    // Use system account ID for queue-generated questions
    const accountId = authData?.account?.id ? Number(authData.account.id) : 1;

    try {
      const result = await module.jobs.processQuestionQueue(accountId);
      return okResponse(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to process queue";
      return serverErrorResponse(errorMessage);
    }
  },
);
