import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/app-access-control/interceptors";
import { studentQuizzes, questions as questionsTable } from "@/lib/app-infrastructure/database/schema";
import { eq, and, inArray } from "drizzle-orm";
import type {
  ApiRouteHandler,
  ApiHandlerContext,
} from "@/types/next";

export const POST: ApiRouteHandler = withApiHandler(
  async (request: NextRequest, { authData, log, db }: ApiHandlerContext) => {
    if (!authData) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const accountId = authData.account.id;
    try {
      const body = await request.json();
      const { quizId, answers } = body;
      if (!quizId || !answers || !Array.isArray(answers)) {
        return NextResponse.json(
          { error: "Quiz ID and answers are required" },
          { status: 400 },
        );
      }
      log.info("Submitting quiz", {
        quizId,
        accountId,
        answersCount: answers.length,
      });

      const [quiz] = await db
        .select()
        .from(studentQuizzes)
        .where(
          and(
            eq(studentQuizzes.id, String(quizId)),
            eq(studentQuizzes.studentAccountId, accountId)
          )
        )
        .limit(1);

      if (!quiz) {
        throw new Error("Quiz not found or access denied");
      }
      if (quiz.status === "completed") {
        throw new Error("Quiz already completed");
      }
      interface QuizQuestion {
        id: string | number;
        body?: string;
        correct_answer?: string;
        complexity?: string;
        subject_title?: string;
        explanation_guide?: string;
      }
      const questions = (quiz.questions as QuizQuestion[]) || [];
      // Extract question IDs from the quiz
      const questionIds = questions.map((q) => String(q.id));
      if (questionIds.length === 0) {
        throw new Error("No questions found in quiz");
      }
      // SECURITY: Fetch correct answers directly from database
      // NEVER trust quiz.questions for correct answers - always fetch from DB
      // This prevents client-side manipulation of correct answers
      const questionsFromDb = questionIds.length
        ? await db
          .select({
            id: questionsTable.id,
            question: questionsTable.question,
            correctAnswer: questionsTable.correctAnswer,
            complexity: questionsTable.complexity,
            answers: questionsTable.answers,
            explanationGuide: questionsTable.explanationGuide
          })
          .from(questionsTable)
          .where(inArray(questionsTable.id, questionIds))
        : [];

      // Create a map of question ID to correct answer
      type QuestionData = {
        correctAnswer: string;
        question: string;
        complexity: string;
        answers: any;
        explanationGuide: any;
      };
      const correctAnswerMap = new Map<string, QuestionData>(
        questionsFromDb.map((q: any) => [
          String(q.id),
          {
            correctAnswer: q.correctAnswer || "",
            question: q.question || "",
            complexity: q.complexity || "",
            answers: q.answers || [],
            explanationGuide: q.explanationGuide,
          },
        ]),
      );
      // ═══════════════════════════════════════════════════════════════
      // SECURITY: ALL ANSWER VALIDATION HAPPENS HERE ON THE SERVER
      // The client NEVER calculates correctness - only displays results
      // ═══════════════════════════════════════════════════════════════
      let correctAnswers = 0;
      let totalAnswered = 0;
      interface DetailedResult {
        question_id: string | number;
        question_body: string;
        user_answer: string | null;
        user_answer_letter?: string | null;
        correct_answer: string;
        is_correct: boolean;
        time_spent: number;
        complexity?: string;
        subject_title?: string;
        explanation?: string;
      }
      const detailedResults: DetailedResult[] = [];
      const answerMap = new Map(answers.map((a: any) => [a.questionId, a]));
      // Helper function to convert letter answer (A, B, C, D) to actual answer text
      const convertLetterToAnswer = (
        letter: string,
        answersArray: any,
      ): string => {
        if (!letter || !answersArray || !Array.isArray(answersArray)) {
          return letter;
        }
        if (answersArray.length === 0) {
          return letter;
        }
        const index = letter.charCodeAt(0) - "A".charCodeAt(0);
        if (index < 0 || index >= answersArray.length) {
          return letter;
        }
        return answersArray[index] || letter;
      };
      questions.forEach((question: QuizQuestion) => {
        const questionKey = String(question.id);
        const dbQuestion = correctAnswerMap.get(questionKey);
        const correctAnswer = dbQuestion?.correctAnswer || "";
        const questionBody = question.body || dbQuestion?.question || "";
        const answersArray = (dbQuestion?.answers as string[]) || [];
        const userAnswer = answerMap.get(String(question.id));

        if (userAnswer) {
          totalAnswered++;
          // Convert letter answer to actual answer text before comparing
          const userAnswerText = convertLetterToAnswer(
            userAnswer.selectedAnswer,
            answersArray,
          );
          const isCorrect = userAnswerText === correctAnswer;
          if (isCorrect) correctAnswers++;
          detailedResults.push({
            question_id: question.id,
            question_body: questionBody,
            user_answer: userAnswerText, // Store converted answer text for consistent display
            user_answer_letter: userAnswer.selectedAnswer, // Store original letter for reference
            correct_answer: correctAnswer,
            is_correct: isCorrect,
            time_spent: userAnswer.timeSpent || 0,
            complexity: question.complexity || dbQuestion?.complexity,
            subject_title: question.subject_title,
            explanation: (dbQuestion?.explanationGuide as any)?.body ?? (dbQuestion?.explanationGuide as any) ?? "",
          });
        } else {
          detailedResults.push({
            question_id: question.id,
            question_body: questionBody,
            user_answer: null,
            user_answer_letter: null,
            correct_answer: correctAnswer,
            is_correct: false,
            time_spent: 0,
            complexity: question.complexity || dbQuestion?.complexity,
            subject_title: question.subject_title,
            explanation: (dbQuestion?.explanationGuide as any)?.body ?? (dbQuestion?.explanationGuide as any) ?? "",
          });
        }
      });
      // SECURITY: Calculate final score and statistics server-side
      // These values are stored in the database and cannot be modified client-side
      const totalQuestions = Number(quiz.totalQuestions) || questions.length;
      const score =
        totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
      const totalTimeSpent = (answers as any[]).reduce(
        (sum, a) => sum + (a.timeSpent || 0),
        0,
      );
      const resultData = {
        score,
        correct_answers: correctAnswers, // Validated server-side count
        total_questions: totalQuestions,
        total_answered: totalAnswered,
        unanswered: totalQuestions - totalAnswered,
        total_time_spent: totalTimeSpent,
        average_time_per_question:
          totalAnswered > 0 ? totalTimeSpent / totalAnswered : 0,
        completed_at: new Date().toISOString(),
        details: detailedResults, // Each detail has server-validated is_correct flag
      };

      // Update quiz
      const [result] = await db
        .update(studentQuizzes)
        .set({
          status: "completed",
          completedAt: new Date(),
          score: score,
          correctAnswers: correctAnswers,
          userAnswers: answers,
          result: resultData,
        })
        .where(eq(studentQuizzes.id, String(quizId)))
        .returning();

      if (!result) {
        throw new Error("Failed to update quiz results");
      }

      log.info("Quiz submitted", { quizId, score: result.score });
      return NextResponse.json(
        { message: "Quiz submitted successfully", quiz: result },
        { status: 200 },
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to submit quiz";
      log.error("Error submitting quiz", error as Error);
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
  },
);
