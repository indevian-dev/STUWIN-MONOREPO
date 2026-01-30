// ═══════════════════════════════════════════════════════════════
// GENERATE REPORT WORKER - AI REPORT GENERATION
// ═══════════════════════════════════════════════════════════════
// Worker endpoint that generates weekly reports for individual students
// Called by QStash queue from the scanner
// ═══════════════════════════════════════════════════════════════
import { NextRequest, NextResponse } from "next/server";
import type { ApiRouteHandler, ApiHandlerContext } from "@/types/next";
import { withApiHandler } from "@/lib/app-access-control/interceptors";
import { qstashReceiver } from "@/lib/integrations/qstashClient";
import { logWorkerProcessing } from "@/lib/integrations/axiomClient";
import { genAI } from "@/lib/integrations/geminiClient";
import type {
  StudentReportData,
  WorkerRequest,
} from "@/types/resources/studentReports";
import { ObjectSchema, SchemaType } from "@google/generative-ai";

const STUDENTS_TABLE = "workspacesStudents";
const ACCOUNTS_TABLE = "accounts";
const QUIZZES_TABLE = "quizzes";
const BOOKMARKS_TABLE = "accountsBookmarks";
const NOTIFICATIONS_TABLE = "accountsNotifications";
const REPORTS_TABLE = "studentReports";
const TOPICS_TABLE = "topics";

// Gemini timeout configuration (30 seconds for Railway)
const GEMINI_TIMEOUT_MS = 30000;
/**
 * POST /api/workspaces/jobs/generate-report
 *
 * Worker endpoint for generating individual student reports
 * - Receives studentId and correlationId from QStash
 * - Fetches student activity data
 * - Generates report using Gemini AI
 * - Saves report to database
 */
export const POST: ApiRouteHandler = withApiHandler(
  async (request: NextRequest, { log, db }: ApiHandlerContext) => {
    const processingStartTime = Date.now();
    // ================================================================
    // SECURITY: Verify QStash Signature
    // ================================================================
    const signature = request.headers.get("upstash-signature");
    const bodyText = await request.text();
    const url = request.url;
    // Allow local development without signature
    if (signature && process.env.NODE_ENV === "production") {
      try {
        const isValid = await qstashReceiver.verify({
          body: bodyText,
          signature,
          url,
        });
        if (!isValid) {
          return NextResponse.json(
            { error: "Unauthorized: Invalid signature" },
            { status: 401 },
          );
        }
      } catch (verifyError) {
        return NextResponse.json(
          { error: "Unauthorized: Signature verification failed" },
          { status: 401 },
        );
      }
    }
    // ================================================================
    // PARSE REQUEST BODY
    // ================================================================
    const requestData: WorkerRequest = JSON.parse(bodyText);
    const { studentId, correlationId } = requestData;
    if (!studentId || !correlationId) {
      return NextResponse.json(
        { error: "Missing studentId or correlationId" },
        { status: 400 },
      );
    }
    // Log worker started
    await logWorkerProcessing({
      correlationId,
      studentId,
      status: "started",
    });
    // ================================================================
    // CALCULATE DATE RANGE (Last 7 days)
    // ================================================================
    const weekEnd = new Date();
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    // ================================================================
    // FETCH STUDENT DATA (Parallel queries for performance)
    // ================================================================
    const studentRecordId = String(studentId).includes(":")
      ? String(studentId)
      : `${STUDENTS_TABLE}:${studentId}`;

    const [student] = await db.query(
      `SELECT * FROM ${STUDENTS_TABLE} WHERE id = $studentId LIMIT 1`,
      { studentId: studentRecordId },
    );

    const studentRecord = student ? [student] : [];

    const ownerAccountId =
      student?.ownerAccauntId ?? student?.ownerAccountId ?? null;
    const accountRecordId = ownerAccountId
      ? `${ACCOUNTS_TABLE}:${ownerAccountId}`
      : null;
    const accountRecord = accountRecordId
      ? await db.query(
        `SELECT * FROM ${ACCOUNTS_TABLE} WHERE id = $accountId LIMIT 1`,
        { accountId: accountRecordId },
      )
      : [];

    const quizzesList = await db.query(
      `SELECT * FROM ${QUIZZES_TABLE}
       WHERE studentAccountId = $studentId
         AND completedAt >= $weekStart
         AND completedAt <= $weekEnd
       ORDER BY completedAt ASC`,
      { studentId, weekStart, weekEnd },
    );

    const subjectIds = Array.from(
      new Set(
        quizzesList
          .map((quiz: any) => quiz.subjectId)
          .filter((value: any) => value !== null && value !== undefined),
      ),
    );

    const topicsList = subjectIds.length
      ? await db.query(
        `SELECT id, name, subjectId FROM ${TOPICS_TABLE} WHERE subjectId IN $ids`,
        { ids: subjectIds },
      )
      : [];

    const topicBySubjectId = new Map<string, string>();
    topicsList.forEach((topic: any) => {
      topicBySubjectId.set(String(topic.subjectId), topic.name);
    });

    const quizResults = quizzesList.map((quiz: any) => ({
      quizzes: quiz,
      topics: quiz.subjectId
        ? { name: topicBySubjectId.get(String(quiz.subjectId)) }
        : null,
    }));

    const bookmarksData = await db.query(
      `SELECT count() AS count FROM ${BOOKMARKS_TABLE} WHERE accountId = $accountId GROUP ALL`,
      { accountId: studentId },
    );

    const notificationsData = await db.query(
      `SELECT * FROM ${NOTIFICATIONS_TABLE}
       WHERE accountId = $accountId AND createdAt >= $weekStart`,
      { accountId: studentId, weekStart },
    );
    // Validate student exists
    if (!studentRecord || studentRecord.length === 0) {
      await logWorkerProcessing({
        correlationId,
        studentId,
        status: "failed",
        error: "Student not found",
      });
      return NextResponse.json(
        { success: false, studentId, error: "Student not found" },
        { status: 404 },
      );
    }
    // ================================================================
    // PROCESS QUIZ DATA
    // ================================================================
    const completedQuizzes = quizResults.filter(
      (q) => q.quizzes.status === "completed",
    );
    const totalQuizzes = completedQuizzes.length;
    const averageScore =
      totalQuizzes > 0
        ? completedQuizzes.reduce((sum, q) => sum + (q.quizzes.score || 0), 0) /
        totalQuizzes
        : 0;
    const topicsStudied = [
      ...new Set(
        completedQuizzes
          .map((q) => q.topics?.name)
          .filter(
            (name): name is string => name !== null && name !== undefined,
          ),
      ),
    ];
    const quizDetails = completedQuizzes.map((q) => ({
      quizId: q.quizzes.id,
      score: q.quizzes.score || 0,
      completedAt: q.quizzes.completedAt,
      topicName: q.topics?.name || "Unknown Topic",
    }));
    // ================================================================
    // PROCESS BOOKMARKS DATA
    // ================================================================
    const totalBookmarks = bookmarksData[0]?.count || 0;
    // ================================================================
    // PROCESS NOTIFICATIONS DATA
    // ================================================================
    const totalNotifications = notificationsData.length;
    const readNotifications = notificationsData.filter(
      (n) => n.markAsRead,
    ).length;
    const engagementRate =
      totalNotifications > 0
        ? (readNotifications / totalNotifications) * 100
        : 0;
    // ================================================================
    // BUILD ACTIVITY SUMMARY
    // ================================================================
    const account = accountRecord[0];
    const activitySummary = {
      weekRange: `${weekStart.toLocaleDateString("az-AZ")} - ${weekEnd.toLocaleDateString("az-AZ")}`,
      quizzes: {
        totalAttempts: totalQuizzes,
        averageScore: Math.round(averageScore * 100) / 100,
        topicsStudied: topicsStudied.slice(0, 5), // Top 5 topics
        quizDetails: quizDetails.slice(0, 10), // Top 10 recent quizzes
      },
      bookmarks: {
        totalBookmarks,
      },
      notifications: {
        totalReceived: totalNotifications,
        totalRead: readNotifications,
        engagementRate: Math.round(engagementRate),
      },
      account: {
        createdAt: account?.createdAt?.toISOString() || "Unknown",
        accountAge: account?.createdAt
          ? Math.floor(
            (Date.now() - new Date(account.createdAt).getTime()) /
            (1000 * 60 * 60 * 24),
          )
          : 0,
      },
    };
    // ================================================================
    // CHECK IF SUFFICIENT DATA EXISTS
    // ================================================================
    if (
      totalQuizzes === 0 &&
      totalBookmarks === 0 &&
      totalNotifications === 0
    ) {
      // Create a default "no activity" report
      const noActivityReport: StudentReportData = {
        score: 0,
        summary: "Bu həftə heç bir aktivlik qeydə alınmayıb.",
        recommendations: [
          "Testləri keçməyə başlayın",
          "Dərslərə baxın və materialları öyrənin",
          "Hər gün ən azı 15 dəqiqə təhsil fəaliyyəti həyata keçirin",
        ],
      };
      const createdReport = await db.query(
        `CREATE ${REPORTS_TABLE} CONTENT $data`,
        {
          data: {
            studentId,
            reportData: noActivityReport,
            generatedAt: new Date(),
            weekStart,
            weekEnd,
          },
        },
      );
      const insertedReport = createdReport[0];
      await logWorkerProcessing({
        correlationId,
        studentId,
        status: "completed",
        processingTimeMs: Date.now() - processingStartTime,
        reportId: insertedReport.id,
      });
      return NextResponse.json({
        success: true,
        studentId,
        reportId: insertedReport.id,
        message: "No activity report generated",
      });
    }
    // ================================================================
    // GENERATE REPORT USING GEMINI AI
    // ================================================================
    const geminiStartTime = Date.now();
    // Define JSON schema for structured output
    const reportSchema = {
      type: SchemaType.OBJECT,
      properties: {
        score: {
          type: SchemaType.NUMBER,
          description: "Overall performance score from 0 to 100",
        },
        summary: {
          type: SchemaType.STRING,
          description: "Weekly activity summary in Azerbaijani language",
        },
        recommendations: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.STRING,
          },
          description: "Array of personalized recommendations in Azerbaijani",
        },
      },
      required: ["score", "summary", "recommendations"],
    };
    // Build prompt
    const prompt = `Sən bir təhsil platforması üçün tələbələrin həftəlik hesabatlarını yaradan köməkçisən.
Tələbə ID: ${studentId}
Həftə: ${activitySummary.weekRange}
AKTIVLIKLƏR:
- Testlər: ${activitySummary.quizzes.totalAttempts} test keçib
- Orta bal: ${activitySummary.quizzes.averageScore}/100
- Öyrənilən mövzular: ${activitySummary.quizzes.topicsStudied.join(", ") || "Yoxdur"}
- Əlfəcinlər: ${activitySummary.bookmarks.totalBookmarks}
- Bildirişlər: ${activitySummary.notifications.totalReceived} alınıb, ${activitySummary.notifications.totalRead} oxunub
- Hesab yaşı: ${activitySummary.account.accountAge} gün
TEST DETALLLARI:
${activitySummary.quizzes.quizDetails.map((q, i) => `${i + 1}. ${q.topicName}: ${q.score} bal`).join("\n")}
TAPŞIRIQ:
Tələbənin performansını təhlil et və həftəlik hesabat hazırla. Hesabat Azərbaycan dilində olmalıdır.
- "score": 0-100 arası ümumi performans balı (testlərin orta balına, aktivliyə və məşğuliyyətə əsasən)
- "summary": 2-3 cümlədən ibarət qısa xülasə (nələr etdi, nə qədər uğurlu oldu)
- "recommendations": 3-5 şəxsi tövsiyə (nəyi yaxşılaşdırmaq lazımdır, hansı mövzulara diqqət yetirmək lazımdır)
Müsbət və motivasiya edici ton işlət. Tələbənin güclü və zəif tərəflərini qeyd et.`;
    try {
      // Use Gemini 1.5 Flash with structured output
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: reportSchema as ObjectSchema,
          temperature: 0.7,
        },
      });
      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error("Gemini request timeout")),
          GEMINI_TIMEOUT_MS,
        );
      });
      // Race between Gemini call and timeout
      const result = await Promise.race([
        model.generateContent(prompt),
        timeoutPromise,
      ]);
      const geminiResponseTime = Date.now() - geminiStartTime;
      const response = (result as any).response.text();
      // Parse JSON response
      const reportData: StudentReportData = JSON.parse(response);
      // Validate report structure
      if (
        typeof reportData.score !== "number" ||
        typeof reportData.summary !== "string" ||
        !Array.isArray(reportData.recommendations)
      ) {
        throw new Error("Invalid report structure from Gemini");
      }
      // ================================================================
      // SAVE REPORT TO DATABASE
      // ================================================================
      const createdReport = await db.query(
        `CREATE ${REPORTS_TABLE} CONTENT $data`,
        {
          data: {
            studentId,
            reportData,
            generatedAt: new Date(),
            weekStart,
            weekEnd,
          },
        },
      );
      const insertedReport = createdReport[0];
      const totalProcessingTime = Date.now() - processingStartTime;
      // Log success
      await logWorkerProcessing({
        correlationId,
        studentId,
        status: "completed",
        processingTimeMs: totalProcessingTime,
        geminiResponseTimeMs: geminiResponseTime,
        reportId: insertedReport.id,
      });
      return NextResponse.json({
        success: true,
        studentId,
        reportId: insertedReport.id,
      });
    } catch (geminiError) {
      const errorMessage =
        geminiError instanceof Error ? geminiError.message : "Unknown error";
      await logWorkerProcessing({
        correlationId,
        studentId,
        status: "failed",
        error: errorMessage,
      });
      return NextResponse.json(
        {
          success: false,
          studentId,
          error: `Gemini API error: ${errorMessage}`,
        },
        { status: 500 },
      );
    }
  },
);
/**
 * GET /api/workspaces/jobs/generate-report
 *
 * Health check endpoint
 */
export const GET: ApiRouteHandler = withApiHandler(
  async (request: NextRequest, { log }: ApiHandlerContext) => {
    return NextResponse.json({
      service: "Generate Report Worker",
      status: "healthy",
      timestamp: new Date().toISOString(),
      config: {
        geminiModel: "gemini-1.5-flash",
        timeoutMs: GEMINI_TIMEOUT_MS,
      },
    });
  },
);


