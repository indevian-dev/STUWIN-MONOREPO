import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/app-access-control/interceptors";
import { db } from "@/lib/app-infrastructure/database";
import { questions, studentQuizzes } from "@/lib/app-infrastructure/database/schema";
import { eq, and, sql } from "drizzle-orm";
import type {
  ApiRouteHandler,
  ApiHandlerContext,
} from "@/types/next";

export const POST: ApiRouteHandler = withApiHandler(
  async (request: any, context: ApiHandlerContext) => {
    const { authData, log, isValidSlimId, generateSlimId } = context;
    if (!authData) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accountId = authData.account.id;
    const workspaceId = context.params.workspaceId as string;

    try {
      const body = await request.json();
      const {
        subjectId = null,
        gradeLevel = null,
        complexity = null,
        language = null,
        questionCount = 25,
      } = body;

      const validQuestionCount = Math.min(
        Math.max(parseInt(questionCount) || 25, 1),
        25,
      );

      log.info("Starting quiz", {
        accountId,
        subjectId,
        gradeLevel,
        complexity,
        language,
        questionCount: validQuestionCount,
      });

      // Prepare filters
      const conditions = [eq(questions.isPublished, true)];

      if (subjectId && isValidSlimId(String(subjectId))) {
        conditions.push(eq(questions.learningSubjectId, String(subjectId)));
      }
      if (gradeLevel) {
        conditions.push(eq(questions.gradeLevel, parseInt(gradeLevel)));
      }
      if (complexity) {
        conditions.push(eq(questions.complexity, complexity));
      }
      if (language) {
        conditions.push(eq(questions.language, language));
      }

      // Fetch random questions
      const selectedQuestions = await db.select()
        .from(questions)
        .where(and(...conditions))
        .orderBy(sql`RANDOM()`)
        .limit(validQuestionCount);

      if (selectedQuestions.length === 0) {
        return NextResponse.json(
          { error: "No questions found matching criteria" },
          { status: 404 },
        );
      }

      // Create quiz
      const quizId = generateSlimId();
      const [newQuiz] = await db.insert(studentQuizzes).values({
        id: quizId,
        studentAccountId: accountId,
        workspaceId: workspaceId,
        learningSubjectId: subjectId && isValidSlimId(String(subjectId)) ? String(subjectId) : null,
        gradeLevel: gradeLevel ? parseInt(gradeLevel) : null,
        language: language,
        totalQuestions: BigInt(selectedQuestions.length),
        status: "in_progress",
        startedAt: new Date(),
        questions: selectedQuestions, // Store serialized questions
      }).returning();

      // Prepare questions for user (hide correct answers)
      const questionsForUser = selectedQuestions.map((q: any) => ({
        id: q.id,
        body: q.question,
        answers: q.answers,
        complexity: q.complexity,
        grade_level: q.gradeLevel,
      }));

      log.info("Quiz started", {
        quizId: newQuiz.id,
        questionsCount: selectedQuestions.length,
      });

      return NextResponse.json(
        {
          message: "Quiz started successfully",
          quiz: {
            id: newQuiz.id,
            subject_id: newQuiz.learningSubjectId,
            grade_level: newQuiz.gradeLevel,
            language: newQuiz.language,
            total_questions: selectedQuestions.length,
            questions: questionsForUser,
          },
        },
        { status: 200 },
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to start quiz";
      if (log) log.error("Error starting quiz", error as Error);
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
  },
);
