import { NextRequest } from 'next/server';
import { unifiedApiHandler, type UnifiedContext } from "@/lib/middleware/handlers/ApiInterceptor";
import { okResponse, errorResponse, serverErrorResponse } from '@/lib/middleware/responses/ApiResponse';

export const POST = unifiedApiHandler(
  async (request: NextRequest, { module, auth, log, params }: UnifiedContext) => {
    const accountId = auth.accountId;
    const workspaceId = params?.workspaceId as string;

    try {
      const body = await request.json();

      log.info("Starting quiz via module", { accountId, workspaceId, ...body });

      const result = await module.quiz.start(accountId, workspaceId, body);

      if (!result.success) {
        return errorResponse(result.error);
      }

      log.info("Quiz started successfully", { quizId: result.data?.id });

      return okResponse(result.data, "Quiz started successfully");
    } catch (error) {
      log.error("Error starting quiz", error);
      return serverErrorResponse("Failed to start quiz");
    }
  },
);
