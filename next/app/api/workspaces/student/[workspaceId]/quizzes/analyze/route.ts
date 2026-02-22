import { NextRequest } from 'next/server';
import { unifiedApiHandler, type UnifiedContext } from "@/lib/middleware/Interceptor.Api.middleware";
import { okResponse, errorResponse, serverErrorResponse } from '@/lib/middleware/Response.Api.middleware';

/**
 * POST /api/workspaces/student/[workspaceId]/quizzes/analyze
 * Generate an AI report for a completed quiz
 */
export const POST = unifiedApiHandler(
  async (request: NextRequest, { module, log }: UnifiedContext) => {
    try {
      const body = await request.json();
      const { quizId, locale } = body;

      if (!quizId) {
        return errorResponse("quizId is required", 400);
      }

      // Analyze full quiz report
      const result = await module.quiz.analyze(quizId, locale);

      if (!result.success) {
        log.error("Failed to analyze quiz", { quizId, error: result.error });
        return serverErrorResponse(result.error);
      }

      return okResponse(result.data);

    } catch (error) {
      log.error("Quiz analysis error", error);
      return errorResponse("Invalid request", 400);
    }
  },
);
