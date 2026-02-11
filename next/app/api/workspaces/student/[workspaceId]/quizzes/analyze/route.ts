import { NextRequest, NextResponse } from "next/server";
import { unifiedApiHandler, type UnifiedContext } from "@/lib/middleware/handlers/ApiInterceptor";

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
        return NextResponse.json({ success: false, error: "quizId is required" }, { status: 400 });
      }

      // Analyze full quiz report
      const result = await module.quiz.analyze(quizId, locale);

      if (!result.success) {
        log.error("Failed to analyze quiz", { quizId, error: result.error });
        return NextResponse.json({ success: false, error: result.error }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        data: result.data,
      });

    } catch (error) {
      log.error("Quiz analysis error", error);
      return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
    }
  },
);
