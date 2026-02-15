import { NextRequest } from 'next/server';
import { unifiedApiHandler, type UnifiedContext } from "@/lib/middleware/handlers/ApiInterceptor";
import { okResponse, errorResponse, serverErrorResponse } from '@/lib/middleware/responses/ApiResponse';

export const DELETE = unifiedApiHandler(
  async (request: NextRequest, { module, auth, log, params }: UnifiedContext) => {
    const accountId = auth.accountId;
    const id = params?.id as string;

    if (!id) {
      return errorResponse("Invalid quiz ID", 400);
    }

    log.info("Deleting quiz", { quizId: id, accountId });

    try {
      const result = await module.quiz.delete(id, accountId);

      if (!result.success) {
        if (result.error === "Quiz not found or access denied") {
          return errorResponse(result.error, 404);
        }
        return serverErrorResponse(result.error);
      }

      log.info("Quiz deleted", { quizId: id });

      return okResponse({ operation: "success", deletedQuizId: id }, "Quiz deleted successfully");
    } catch (error) {
      log.error("Error deleting quiz", error);
      return serverErrorResponse("Error deleting quiz");
    }
  },
);
