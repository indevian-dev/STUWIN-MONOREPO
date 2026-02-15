import { NextRequest } from 'next/server';
import { unifiedApiHandler, type UnifiedContext } from "@/lib/middleware/handlers/ApiInterceptor";
import { okResponse, errorResponse, serverErrorResponse } from '@/lib/middleware/responses/ApiResponse';

export const POST = unifiedApiHandler(
  async (request: NextRequest, { module, auth, log }: UnifiedContext) => {
    const accountId = auth.accountId;

    try {
      const body = await request.json();
      const { quizId, answers, analytics } = body;

      if (!quizId || !answers || !Array.isArray(answers)) {
        return errorResponse("Quiz ID and answers are required", 400);
      }

      log.info("Submitting quiz via module", { quizId, accountId, answersCount: answers.length });

      const result = await module.quiz.submit(quizId, accountId, answers, analytics);

      if (!result.success) {
        return errorResponse(result.error, 400);
      }

      log.info("Quiz submitted successfully", { quizId, score: result.data?.score });

      return okResponse(result.data, "Quiz submitted successfully");
    } catch (error) {
      log.error("Error submitting quiz", error);
      return serverErrorResponse("Failed to submit quiz");
    }
  },
);
