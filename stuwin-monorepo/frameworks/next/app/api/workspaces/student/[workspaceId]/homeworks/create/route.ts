// ═══════════════════════════════════════════════════════════════
// CREATE HOMEWORK API
// ═══════════════════════════════════════════════════════════════
// Dedicated endpoint for creating new homework submissions
// ═══════════════════════════════════════════════════════════════

import { withApiHandler } from "@/lib/app-access-control/interceptors";
import { studentHomeworks } from "@/lib/app-infrastructure/database/schema";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { ApiHandlerContext } from "@/types/next";

/**
 * POST /api/workspaces/students/homeworks/create
 * Create a new homework submission
 */
export const POST = withApiHandler(
  async (req: NextRequest, { db, authData, generateSlimId }: ApiHandlerContext) => {
    const body = await req.json();

    const { title, description, subject, topicId, quizId } = body;

    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    try {
      const [newHomework] = await db
        .insert(studentHomeworks)
        .values({
          id: generateSlimId ? generateSlimId() : undefined,
          studentAccountId: authData?.account?.id || "",
          workspaceId: authData?.account?.workspaceId || "",
          title,
          description: description || null,
          subject: subject || null,
          topicId: topicId || null,
          quizId: quizId || null,
          status: "pending",
          createdAt: new Date(),
        })
        .returning();

      if (!newHomework) {
        return NextResponse.json(
          { error: "Failed to create homework" },
          { status: 500 },
        );
      }

      return NextResponse.json(
        {
          homework: newHomework,
        },
        { status: 201 },
      );
    } catch (error) {
      console.error("POST homework error:", error);
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Failed to create homework",
        },
        { status: 500 },
      );
    }
  },
);
