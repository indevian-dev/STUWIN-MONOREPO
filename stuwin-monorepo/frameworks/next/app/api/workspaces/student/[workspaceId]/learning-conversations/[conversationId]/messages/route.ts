import { NextRequest, NextResponse } from "next/server";
import { unifiedApiHandler, type UnifiedContext } from "@/lib/app-access-control/interceptors/ApiInterceptor";

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
        return NextResponse.json({ error: "content is required" }, { status: 400 });
      }

      if (!conversationId || !isValidSlimId(conversationId)) {
        return NextResponse.json({ error: "Valid conversation ID is required" }, { status: 400 });
      }

      log.info("Processing chat message for session", { conversationId, accountId: auth.accountId });

      const result = await module.activity.addMessageToSession(conversationId, content);

      if (!result.success) {
        log.error("Failed to process chat message", { conversationId, error: result.error });
        return NextResponse.json({ success: false, error: result.error }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        data: result.data,
      });

    } catch (error) {
      log.error("Chat message error", error);
      return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
    }
  },
);
