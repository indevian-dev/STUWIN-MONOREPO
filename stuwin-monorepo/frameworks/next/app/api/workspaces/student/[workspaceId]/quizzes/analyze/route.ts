import { withApiHandler } from "@/lib/app-access-control/interceptors";
import { ModuleFactory } from "@/lib/app-core-modules/factory";
import { NextResponse } from "next/server";

/**
 * POST /api/workspaces/student/[workspaceId]/quizzes/analyze
 * Generate an AI report for a completed quiz
 */
export const POST = withApiHandler(
  async (req: any, { ctx, log, params }) => {
    try {
      const body = await req.json();
      const { quizId, locale } = body;
      const modules = new ModuleFactory(ctx);

      if (quizId) {
        // Analyze full quiz report
        const result = await modules.activity.analyzeQuiz(quizId, locale);
        if (!result.success) {
          log.error("Failed to analyze quiz", { quizId, error: result.error });
          return NextResponse.json({ success: false, error: result.error }) as any;
        }
        return NextResponse.json({
          success: true,
          data: result.data,
        }) as any;
      } else {
        return NextResponse.json({ success: false, error: "quizId is required" }, { status: 400 }) as any;
      }

    } catch (error) {
      log.error("Quiz analysis error", error);
      return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 }) as any;
    }
  },
  {
    method: "POST",
    authRequired: true,
  }
);

