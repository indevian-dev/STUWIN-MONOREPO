import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/app-access-control/interceptors";
import { studentQuizzes } from "@/lib/app-infrastructure/database/schema";
import { eq, and } from "drizzle-orm";
import type {
  ApiRouteHandler,
  ApiHandlerContext,
} from "@/types/next";

export const DELETE: ApiRouteHandler = withApiHandler(
  async (
    request: NextRequest,
    { authData, params, log, db }: ApiHandlerContext,
  ) => {
    if (!authData) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    if (!resolvedParams?.id) {
      return NextResponse.json({ error: "Invalid quiz ID" }, { status: 400 });
    }

    const { id } = resolvedParams;
    const accountId = authData.account.id;

    if (!id) {
      return NextResponse.json({ error: "Invalid quiz ID" }, { status: 400 });
    }

    log.info("Deleting quiz", { quizId: id, accountId });

    try {
      const existing = await db
        .select({ id: studentQuizzes.id })
        .from(studentQuizzes)
        .where(
          and(
            eq(studentQuizzes.id, id),
            eq(studentQuizzes.studentAccountId, accountId)
          )
        )
        .limit(1);

      if (!existing || existing.length === 0) {
        throw new Error("QUIZ_NOT_FOUND");
      }

      await db
        .delete(studentQuizzes)
        .where(
          and(
            eq(studentQuizzes.id, id),
            eq(studentQuizzes.studentAccountId, accountId)
          )
        );

      const result = { deletedQuizId: id };

      log.info("Quiz deleted", { quizId: id });
      return NextResponse.json(
        {
          operation: "success",
          message: "Quiz deleted successfully",
          ...result,
        },
        { status: 200 },
      );
    } catch (error) {
      if (error instanceof Error && error.message === "QUIZ_NOT_FOUND") {
        return NextResponse.json(
          { error: "Quiz not found or access denied" },
          { status: 404 },
        );
      }
      log.error(
        "Error deleting quiz",
        error instanceof Error ? error : new Error(String(error)),
      );
      return NextResponse.json(
        { error: "Error deleting quiz" },
        { status: 500 },
      );
    }
  },
);
