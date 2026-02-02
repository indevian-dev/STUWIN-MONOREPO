import { NextRequest, NextResponse } from "next/server";
import { unifiedApiHandler, type UnifiedContext } from "@/lib/app-access-control/interceptors/ApiInterceptor";

export const POST = unifiedApiHandler(
  async (request: NextRequest, { module, auth, log }: UnifiedContext) => {
    const accountId = auth.accountId;

    try {
      const body = await request.json();
      const { quizId, answers, analytics } = body;

      if (!quizId || !answers || !Array.isArray(answers)) {
        return NextResponse.json(
          { error: "Quiz ID and answers are required" },
          { status: 400 },
        );
      }

      log.info("Submitting quiz via module", { quizId, accountId, answersCount: answers.length });

      const result = await module.activity.submitQuiz(quizId, accountId, answers, analytics);

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      log.info("Quiz submitted successfully", { quizId, score: result.data?.score });

      return NextResponse.json(
        { message: "Quiz submitted successfully", quiz: result.data },
        { status: 200 },
      );
    } catch (error) {
      log.error("Error submitting quiz", error);
      return NextResponse.json(
        { error: "Failed to submit quiz" },
        { status: 500 },
      );
    }
  },
);
