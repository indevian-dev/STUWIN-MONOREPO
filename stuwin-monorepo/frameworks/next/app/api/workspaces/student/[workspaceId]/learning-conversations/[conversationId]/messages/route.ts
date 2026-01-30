import { withApiHandler } from "@/lib/app-access-control/interceptors";
import { getLearningAssistantService } from "@/lib/app-core-modules/services/LearningAssistantService";
import { NextResponse } from "next/server";
import { db } from "@/lib/app-infrastructure/database";
import { studentLearningSessions } from "@/lib/app-infrastructure/database/schema";
import { eq } from "drizzle-orm";
import type { ConversationMessage } from "@/types/resources/learningConversations";

// Helper function to get ancestor chain of messages
function getAncestorChain(messages: ConversationMessage[], messageId: string): ConversationMessage[] {
  const chain: ConversationMessage[] = [];
  let current = messages.find((m) => m.id === messageId);

  while (current) {
    chain.unshift(current);
    current = messages.find((m) => m.id === current.parentId);
  }

  return chain;
}

/**
 * POST /api/workspaces/students/learning-conversations/:conversationId/messages
 * Add student message and get AI response
 */
export const POST = withApiHandler(
  async (req: any, context) => {
    const { isValidSlimId, generateSlimId, log } = context;
    const { conversationId } = context.params;
    const body = await req.json();

    const { parentMessageId, content } = body;

    if (!parentMessageId || !content) {
      return NextResponse.json(
        {
          error: "parentMessageId and content are required",
        },
        { status: 400 },
      );
    }

    try {
      if (!conversationId || !isValidSlimId(String(conversationId))) {
        return NextResponse.json(
          { error: "Valid conversation ID is required" },
          { status: 400 },
        );
      }

      if (!isValidSlimId(String(parentMessageId))) {
        return NextResponse.json(
          { error: "Valid parentMessageId is required" },
          { status: 400 },
        );
      }

      // 1. Fetch conversation
      const conv = await db.query.studentLearningSessions.findFirst({
        where: eq(studentLearningSessions.id, String(conversationId))
      });

      if (!conv) {
        return NextResponse.json(
          { error: "Conversation not found" },
          { status: 404 },
        );
      }

      const messages = (conv.messages as any).nodes as ConversationMessage[];

      // 2. Validate parent message exists
      const parentMsg = messages.find((m) => m.id === parentMessageId);
      if (!parentMsg) {
        return NextResponse.json(
          { error: "Parent message not found" },
          { status: 400 },
        );
      }

      // 3. Create student message
      const nextId = generateSlimId();
      const parentPath = parentMsg.branchPath;
      const newBranchPath = `${parentPath}-${nextId}`;
      const branchDepth = (parentPath.match(/-/g) || []).length;

      const studentMessage: ConversationMessage = {
        id: nextId,
        parentId: parentMessageId,
        branchPath: newBranchPath,
        branchDepth,
        role: "student",
        content,
        createdAt: new Date().toISOString(),
      };

      // 4. Generate AI response
      const aiService = getLearningAssistantService();
      const ancestorChain = getAncestorChain(messages, parentMessageId);

      const aiResponse = await aiService.generateConversationResponse(content, {
        conversationHistory: ancestorChain,
        rootQuestion: conv.rootQuestion,
        currentTokensUsed: conv.totalTokensUsed || 0,
      });

      // 5. Create AI message
      const aiMessageId = generateSlimId();
      const aiMessage: ConversationMessage = {
        id: aiMessageId,
        parentId: nextId,
        branchPath: `${newBranchPath}-${aiMessageId}`,
        branchDepth,
        role: "ai",
        content: aiResponse.content,
        aiExplanation: aiResponse.explanation,
        aiSuggestions: aiResponse.suggestions,
        learningTips: aiResponse.learningTips,
        createdAt: new Date().toISOString(),
      };

      // 6. Update conversation in database
      const updatedMessages = [...messages, studentMessage, aiMessage];
      const isBranchStart =
        parentMsg.role === "ai" &&
        messages.some(
          (m) => m.parentId === parentMessageId && m.role === "student",
        );

      const [updated] = await db.update(studentLearningSessions)
        .set({
          messages: { nodes: updatedMessages },
          messageCount: updatedMessages.length,
          totalTokensUsed: (conv.totalTokensUsed || 0) + aiResponse.tokensUsed,
          branchCount: isBranchStart
            ? (conv.branchCount || 0) + 1
            : (conv.branchCount || 0),
          updatedAt: new Date(),
        })
        .where(eq(studentLearningSessions.id, String(conversationId)))
        .returning();

      if (!updated) {
        return NextResponse.json(
          { error: "Failed to update conversation" },
          { status: 500 },
        );
      }

      return NextResponse.json(
        {
          studentMessageId: studentMessage.id,
          studentMessage,
          aiMessage,
          branchPath: newBranchPath,
          totalTokensUsed: aiResponse.tokensUsed,
          conversation: updated,
        },
        { status: 200 },
      );
    } catch (error) {
      if (log) log.error("Error adding message to conversation:", error);
      return NextResponse.json(
        {
          error:
            error instanceof Error ? error.message : "Internal server error",
        },
        { status: 500 },
      );
    }
  },
  {
    method: "POST",
    authRequired: true,
  },
);
