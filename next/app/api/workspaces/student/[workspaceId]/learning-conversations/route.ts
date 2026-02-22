import { NextRequest } from 'next/server';
import { unifiedApiHandler, type UnifiedContext } from "@/lib/middleware/Interceptor.Api.middleware";
import { okResponse, errorResponse, serverErrorResponse } from '@/lib/middleware/Response.Api.middleware';

/**
 * GET /api/workspaces/student/[workspaceId]/learning-conversations
 * List all conversations or fetch specific one
 */
export const GET = unifiedApiHandler(
  async (request: NextRequest, { module, auth, log }: UnifiedContext) => {
    const searchParams = request.nextUrl.searchParams;
    const conversationId = searchParams.get("id");
    const status = searchParams.get("status") || "active";

    try {
      // Fetch single conversation
      if (conversationId) {
        const result = await module.aiSession.getById(conversationId);

        if (!result.success || !result.data) {
          return errorResponse(result.error ?? "Conversation not found", 404);
        }

        const conversation = result.data as any;

        // Access control: Ensure the conversation belongs to the student
        if (conversation.studentAccountId !== auth.accountId) {
          return errorResponse("Access denied", 403, "FORBIDDEN");
        }

        return okResponse({ id: conversation.id.toString(), status: conversation.status, rootQuestion: conversation.rootQuestion, messages: conversation.digests, // Using digests for the new UI
          branchCount: conversation.branchCount, messageCount: conversation.messageCount, createdAt: conversation.createdAt, updatedAt: conversation.updatedAt });
      }

      // List conversations
      const result = await module.aiSession.list(auth.accountId, status);

      if (!result.success || !result.data) {
        return serverErrorResponse(result.error ?? "Failed to fetch list");
      }

      const conversations = result.data as any[];

      const responses = conversations.map((conv: any) => ({
        id: conv.id.toString(),
        status: conv.status,
        rootQuestion: conv.rootQuestion,
        messages: conv.digests,
        branchCount: conv.branchCount,
        messageCount: conv.messageCount,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
      }));

      return okResponse({ data: responses, pagination: {
          total: conversations.length,
        } });
    } catch (error) {
      log.error("GET learning conversations error", error);
      return serverErrorResponse("Failed to fetch conversations");
    }
  },
);
