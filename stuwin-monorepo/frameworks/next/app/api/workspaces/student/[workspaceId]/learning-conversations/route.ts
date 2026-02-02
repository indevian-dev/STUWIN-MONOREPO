import { NextRequest, NextResponse } from "next/server";
import { unifiedApiHandler, type UnifiedContext } from "@/lib/app-access-control/interceptors/ApiInterceptor";

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
        const result = await module.activity.getAiSessionById(conversationId);

        if (!result.success || !result.data) {
          return NextResponse.json({ error: result.error ?? "Conversation not found" }, { status: 404 });
        }

        const conversation = result.data as any;

        // Access control: Ensure the conversation belongs to the student
        if (conversation.studentAccountId !== auth.accountId) {
          return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        return NextResponse.json({
          id: conversation.id.toString(),
          status: conversation.status,
          rootQuestion: conversation.rootQuestion,
          messages: conversation.digests, // Using digests for the new UI
          branchCount: conversation.branchCount,
          messageCount: conversation.messageCount,
          createdAt: conversation.createdAt,
          updatedAt: conversation.updatedAt,
        });
      }

      // List conversations
      const result = await module.activity.listAiSessions(auth.accountId, status);

      if (!result.success || !result.data) {
        return NextResponse.json({ error: result.error ?? "Failed to fetch list" }, { status: 500 });
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

      return NextResponse.json({
        data: responses,
        pagination: {
          total: conversations.length,
        },
      });
    } catch (error) {
      log.error("GET learning conversations error", error);
      return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 });
    }
  },
);
