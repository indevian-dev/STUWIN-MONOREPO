import { NextRequest, NextResponse } from "next/server";
import { unifiedApiHandler, type UnifiedContext } from "@/lib/middleware/handlers/ApiInterceptor";

export const DELETE = unifiedApiHandler(
  async (request: NextRequest, { module, auth, log, params }: UnifiedContext) => {
    const accountId = auth.accountId;
    const id = params?.id as string;

    if (!id) {
      return NextResponse.json({ error: "Invalid quiz ID" }, { status: 400 });
    }

    log.info("Deleting quiz", { quizId: id, accountId });

    try {
      const result = await module.quiz.delete(id, accountId);

      if (!result.success) {
        if (result.error === "Quiz not found or access denied") {
          return NextResponse.json({ error: result.error }, { status: 404 });
        }
        return NextResponse.json({ error: result.error }, { status: 500 });
      }

      log.info("Quiz deleted", { quizId: id });

      return NextResponse.json(
        {
          operation: "success",
          message: "Quiz deleted successfully",
          deletedQuizId: id,
        },
        { status: 200 },
      );
    } catch (error) {
      log.error("Error deleting quiz", error);
      return NextResponse.json(
        { error: "Error deleting quiz" },
        { status: 500 },
      );
    }
  },
);
