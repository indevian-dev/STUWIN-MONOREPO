// ═══════════════════════════════════════════════════════════════
// LEARNING CONVERSATIONS API - LIST & FETCH
// ═══════════════════════════════════════════════════════════════
// Endpoints for retrieving learning conversations
// GET: List all conversations or fetch specific one
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { withApiHandler } from "@/lib/app-access-control/interceptors";
import { studentLearningSessions } from "@/lib/app-infrastructure/database/schema";
import { eq, and, desc } from "drizzle-orm";
import type { LearningConversationResponse } from "@/types/resources/learningConversations";

export const GET = withApiHandler(
  async (req: NextRequest, context: any) => {
    const db = context.db;
    const searchParams = req.nextUrl.searchParams;
    const conversationId = searchParams.get("id");
    const status = searchParams.get("status") || "active";
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    try {
      // Fetch single conversation
      if (conversationId) {

        const conversation = await db
          .select()
          .from(studentLearningSessions)
          .where(eq(studentLearningSessions.id, conversationId))
          .limit(1)
          .then((rows: any[]) => rows[0]);

        if (!conversation) {
          return NextResponse.json(
            { error: "Conversation not found" },
            { status: 404 },
          );
        }

        const response: LearningConversationResponse = {
          id: conversation.id.toString(), // Convert bigint to string for response
          status: conversation.status,
          rootQuestion: conversation.rootQuestion,
          messages: conversation.messages,
          branchCount: conversation.branchCount,
          messageCount: conversation.messageCount,
          createdAt: conversation.createdAt,
          updatedAt: conversation.updatedAt,
        };

        return NextResponse.json(response, { status: 200 });
      }

      // List conversations
      const conversations = await db
        .select()
        .from(studentLearningSessions)
        .where(eq(studentLearningSessions.status, status))
        .orderBy(desc(studentLearningSessions.createdAt))
        .limit(limit)
        .offset(offset);

      const responses: LearningConversationResponse[] = conversations.map(
        (conv: any) => ({
          id: conv.id.toString(),
          status: conv.status,
          rootQuestion: conv.rootQuestion,
          messages: conv.messages,
          branchCount: conv.branchCount,
          messageCount: conv.messageCount,
          createdAt: conv.createdAt,
          updatedAt: conv.updatedAt,
        }),
      );

      return NextResponse.json(
        {
          data: responses,
          pagination: {
            limit,
            offset,
            total: conversations.length, // Note: This is page length, not total count.
          },
        },
        { status: 200 },
      );
    } catch (error) {
      console.error("GET learning conversations error:", error);
      return NextResponse.json(
        { error: "Failed to fetch conversations" },
        { status: 500 },
      );
    }
  },
  {
    method: "GET",
    authRequired: true,
    type: "api",
  },
);
