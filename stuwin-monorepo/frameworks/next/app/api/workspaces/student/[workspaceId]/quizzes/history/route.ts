import type { NextRequest } from "next/server";
import type { ApiRouteHandler, ApiHandlerContext } from "@/types/next";
import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/app-access-control/interceptors";
import { studentQuizzes, learningSubjects } from "@/lib/app-infrastructure/database/schema";
import { eq, and, desc, sql, inArray } from "drizzle-orm";

export const GET: ApiRouteHandler = withApiHandler(
  async (request: NextRequest, { authData, log, db, isValidSlimId }: ApiHandlerContext) => {
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

    log.debug("Fetching quiz history", { accountId, page, pageSize, status });

    try {
      const conditions = [eq(studentQuizzes.studentAccountId, accountId)];

      if (
        status &&
        (status === "in_progress" ||
          status === "completed" ||
          status === "abandoned")
      ) {
        conditions.push(eq(studentQuizzes.status, status));
      }

      if (subjectId) {
        const trimmedSubjectId = subjectId.trim();
        if (isValidSlimId && isValidSlimId(trimmedSubjectId)) {
          conditions.push(eq(studentQuizzes.learningSubjectId, trimmedSubjectId));
        }
      }

      const whereClause = and(...conditions);

      const countResult = await db
        .select({ total: sql<number>`count(*)` })
        .from(studentQuizzes)
        .where(whereClause);

      const total = Number(countResult[0]?.total || 0);

      const quizzesList = await db
        .select()
        .from(studentQuizzes)
        .where(whereClause)
        .orderBy(desc(studentQuizzes.createdAt))
        .limit(pageSize)
        .offset(offset);

      const subjectIds = Array.from(
        new Set(
          quizzesList
            .map((quiz: any) => quiz.learningSubjectId)
            .filter((value: any): value is string => value !== null && value !== undefined)
        )
      ) as string[];

      const subjectsList = subjectIds.length
        ? await db
          .select({ id: learningSubjects.id, title: learningSubjects.title, slug: learningSubjects.slug })
          .from(learningSubjects)
          .where(inArray(learningSubjects.id, subjectIds))
        : [];

      const subjectsById = new Map<string, any>();
      for (const subject of subjectsList) {
        subjectsById.set(String(subject.id), subject);
      }

      const quizzesWithSubjects = quizzesList.map((quiz: any) => {
        const subjectKey = String(quiz.learningSubjectId);
        const subject = subjectsById.get(subjectKey);
        return {
          ...quiz,
          subjectTitle: subject?.title ?? null,
          subjectSlug: subject?.slug ?? null,
        };
      });

      // Normalize quizzes to ensure status is never null
      const normalizedQuizzes = quizzesWithSubjects.map((quiz: any) => ({
        ...quiz,
        status: quiz.status || ("in_progress" as const),
      }));

      log.info("Quiz history fetched", {
        count: normalizedQuizzes.length,
        total,
      });

      return NextResponse.json(
        {
          operation: "success",
          quizzes: normalizedQuizzes,
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
          hasNextPage: page < Math.ceil(total / pageSize),
          hasPrevPage: page > 1,
        },
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch quiz history";
      log.error(
        "Error fetching quiz history",
        error instanceof Error ? error : new Error(String(error)),
      );
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
  },
);
