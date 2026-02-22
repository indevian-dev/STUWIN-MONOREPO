import { NextRequest } from 'next/server';
import { unifiedApiHandler, type UnifiedContext } from "@/lib/middleware/Interceptor.Api.middleware";
import { okResponse, errorResponse, serverErrorResponse } from '@/lib/middleware/Response.Api.middleware';

export const GET = unifiedApiHandler(
  async (request: NextRequest, { module, params, auth, log, isValidSlimId }: UnifiedContext) => {
    const quizId = params?.id as string;
    const accountId = auth.accountId;

    if (!quizId || !isValidSlimId(quizId)) {
      return errorResponse("Valid quiz ID is required", 400);
    }

    log.debug("Fetching quiz", { quizId });

    try {
      const result = await module.quiz.getDetail(quizId);

      if (!result.success) {
        return errorResponse(result.error, 404);
      }

      const quiz = result.data;

      // Access control: Ensure the quiz belongs to the student
      if (quiz.studentAccountId !== accountId) {
        return errorResponse("Access denied", 403, "FORBIDDEN");
      }

      log.info("Quiz fetched", { quizId });
      return okResponse({ quiz: quiz });
    } catch (error) {
      log.error("Error fetching quiz", error);
      return serverErrorResponse("Failed to fetch quiz");
    }
  },
);
