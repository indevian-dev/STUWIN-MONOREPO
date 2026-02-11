import { NextRequest, NextResponse } from "next/server";
import { unifiedApiHandler, type UnifiedContext } from "@/lib/middleware/handlers/ApiInterceptor";

export const GET = unifiedApiHandler(
  async (request: NextRequest, { module, params, auth, log, isValidSlimId }: UnifiedContext) => {
    const quizId = params?.id as string;
    const accountId = auth.accountId;

    if (!quizId || !isValidSlimId(quizId)) {
      return NextResponse.json({ error: "Valid quiz ID is required" }, { status: 400 });
    }

    log.debug("Fetching quiz", { quizId });

    try {
      const result = await module.quiz.getDetail(quizId);

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 404 });
      }

      const quiz = result.data;

      // Access control: Ensure the quiz belongs to the student
      if (quiz.studentAccountId !== accountId) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }

      log.info("Quiz fetched", { quizId });
      return NextResponse.json({ operation: "success", quiz });
    } catch (error) {
      log.error("Error fetching quiz", error);
      return NextResponse.json({ error: "Failed to fetch quiz" }, { status: 500 });
    }
  },
);
