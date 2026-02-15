import { NextRequest } from 'next/server';
import { unifiedApiHandler, type UnifiedContext } from "@/lib/middleware/handlers/ApiInterceptor";
import { okResponse, errorResponse, serverErrorResponse } from '@/lib/middleware/responses/ApiResponse';

export const POST = unifiedApiHandler(
  async (request: NextRequest, { module, params, auth, log }: UnifiedContext) => {
    const questionId = params?.id as string;
    const accountId = auth.accountId;

    if (!questionId) {
      return errorResponse("Question ID is required", 400);
    }

    try {
      // Get the question
      const questionResult = await module.question.getById(questionId);
      if (!questionResult.success) {
        return errorResponse("Question not found", 404, "NOT_FOUND");
      }

      // Update question to be published
      const updateResult = await module.question.update(questionId, {
        isPublished: true,
        reviewerAccountId: accountId,
        updatedAt: new Date(),
      });

      if (!updateResult.success) {
        return serverErrorResponse("Failed to publish question");
      }

      // TODO: Create notification for author if needed
      // This can be handled in a separate service or here

      return okResponse(updateResult.data, "Question published successfully");

    } catch (error) {
      log.error("Error syncing (publishing) question", error);
      return serverErrorResponse("Failed to publish question");
    }
  },
);
