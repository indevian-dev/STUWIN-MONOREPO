import type { NextRequest } from "next/server";
import type { ApiRouteHandler, ApiHandlerContext } from "@/types/next";
import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/app-access-control/interceptors";
import { studentQuizzes } from "@/lib/app-infrastructure/database/schema";
import { eq, and, count, desc } from "drizzle-orm";

export const GET: ApiRouteHandler = withApiHandler(
  async (request: NextRequest, { authData, log, db }: ApiHandlerContext) => {
    if (!authData) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accountId = authData.account.id;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);
    const status = searchParams.get("status") as
      | "in_progress"
      | "completed"
      | "abandoned"
      | null;
    const subjectId = searchParams.get("subjectId");

    const offset = (page - 1) * pageSize;

    log.debug("Fetching user quizzes", { accountId, page, pageSize });

    try {
      const conditions = [
        eq(studentQuizzes.studentAccountId, accountId)
      ];

      if (
        status &&
        (status === "in_progress" ||
          status === "completed" ||
          status === "abandoned")
      ) {
        conditions.push(eq(studentQuizzes.status, status));
      }
      if (subjectId) {
        conditions.push(eq(studentQuizzes.learningSubjectId, subjectId));
      }

      // Get count
      const countResult = await db
        .select({ total: count() })
        .from(studentQuizzes)
        .where(and(...conditions));

      const total = countResult[0]?.total || 0;

      // Get quizzes
      const quizzesList = await db
        .select()
        .from(studentQuizzes)
        .where(and(...conditions))
        .orderBy(desc(studentQuizzes.createdAt))
        .limit(pageSize)
        .offset(offset);

      log.info("User quizzes fetched", { count: quizzesList.length, total });
      return NextResponse.json({
        operation: "success",
        quizzes: quizzesList.map((q: any) => ({
          ...q,
          id: q.id.toString(),
          studentAccountId: q.studentAccountId?.toString(),
          learningSubjectId: q.learningSubjectId?.toString()
        })),
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        hasNextPage: page < Math.ceil(total / pageSize),
        hasPrevPage: page > 1,
      });
    } catch (error) {
      log.error(
        "Error fetching user quizzes",
        error instanceof Error ? error : new Error(String(error)),
      );
      return NextResponse.json(
        { error: "Error fetching quizzes" },
        { status: 500 },
      );
    }
  },
);
