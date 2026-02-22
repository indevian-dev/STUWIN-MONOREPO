import { NextRequest } from 'next/server';
import { unifiedApiHandler, type UnifiedContext } from "@/lib/middleware/Interceptor.Api.middleware";
import { okResponse, errorResponse, serverErrorResponse } from '@/lib/middleware/Response.Api.middleware';

/**
 * POST /api/workspaces/student/[workspaceId]/learning-conversations/[conversationId]/messages
 * Add student message and get AI response using deep-dive digest system
 */
export const POST = unifiedApiHandler(
  async (request: NextRequest, { module, auth, log, params, isValidSlimId }: UnifiedContext) => {
    const conversationId = params?.conversationId as string;

    try {
      const body = await request.json();
      const { content } = body;

      if (!content) {
        return errorResponse("content is required", 400);
      }

      if (!conversationId || !isValidSlimId(conversationId)) {
        return errorResponse("Valid conversation ID is required", 400);
      }

      log.info("Processing chat message for session", { conversationId, accountId: auth.accountId });

      const result = await module.aiSession.addMessage(conversationId, content);

      if (!result.success) {
        log.error("Failed to process chat message", { conversationId, error: result.error });
        return serverErrorResponse(result.error);
      }

      return okResponse(result.data);

    } catch (error) {
      log.error("Chat message error", error);
      return errorResponse("Invalid request", 400);
    }
  },
);
