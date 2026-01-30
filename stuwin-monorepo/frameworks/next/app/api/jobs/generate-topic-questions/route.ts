// ═══════════════════════════════════════════════════════════════
// GENERATE TOPIC QUESTIONS WORKER - AI QUESTION GENERATION
// ═══════════════════════════════════════════════════════════════
// Worker endpoint that generates questions for topics below capacity
// Called by QStash queue from the topic scanner
// ═══════════════════════════════════════════════════════════════
import { NextRequest, NextResponse } from "next/server";
import type { ApiRouteHandler, ApiHandlerContext } from "@/types/next";
import { withApiHandler } from "@/lib/app-access-control/interceptors";
import { qstashReceiver } from "@/lib/integrations/qstashClient";
import { logTopicWorker } from "@/lib/integrations/axiomClient";
import { TOPICS } from "@/lib/app-infrastructure/database";
import { QuestionGenerationService } from "@/lib/app-core-modules/services/QuestionGenerationService";
import type { TopicWorkerRequest } from "@/types/resources/topicJobs";
// Configuration
const GEMINI_TIMEOUT_MS = 45000; // 45 seconds for question generation
const SYSTEM_ACCOUNT_ID = 1; // System account for automated generation
/**
 * POST /api/workspaces/jobs/generate-topic-questions
 *
 * Worker endpoint for generating questions for individual topics
 * - Receives topicId, correlationId, and questionsToGenerate from QStash
 * - Fetches topic data
 * - Generates questions using Gemini AI
 * - Saves questions to database and updates topic stats
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
    const requestData: TopicWorkerRequest = JSON.parse(bodyText);
    const { topicId, correlationId, questionsToGenerate } = requestData;
    if (!topicId || !correlationId || !questionsToGenerate) {
      return NextResponse.json(
        { error: "Missing topicId, correlationId, or questionsToGenerate" },
        { status: 400 },
      );
    }
    // Log worker started
    await logTopicWorker({
      correlationId,
      topicId,
      status: "started",
    });
    // ================================================================
    // FETCH TOPIC DATA
    // ================================================================
    const topicRecordId = String(topicId).includes(":")
      ? String(topicId)
      : `${TOPICS}:${topicId}`;
    const [topic] = await db.query(
      `SELECT * FROM ${TOPICS} WHERE id = $topicId LIMIT 1`,
      { topicId: topicRecordId },
    );
    if (!topic) {
      await logTopicWorker({
        correlationId,
        topicId,
        status: "failed",
        error: "Topic not found",
      });
      return NextResponse.json(
        { success: false, topicId, error: "Topic not found" },
        { status: 404 },
      );
    }
    // ================================================================
    // CALCULATE ACTUAL QUESTIONS TO GENERATE
    // ================================================================
    const currentStats = topic.topicGeneralQuestionsStats || 0;
    const capacity = topic.topicEstimatedQuestionsCapacity || 0;
    const remaining = capacity - currentStats;
    // If already at capacity, skip
    if (remaining <= 0) {
      await logTopicWorker({
        correlationId,
        topicId,
        status: "completed",
        questionsGenerated: 0,
        currentStats,
        capacity,
      });
      return NextResponse.json({
        success: true,
        topicId,
        questionsGenerated: 0,
        currentStats,
        capacity,
        message: "Topic already at capacity",
      });
    }
    // Don't generate more than remaining capacity
    const toGenerate = Math.min(questionsToGenerate, remaining);
    // ================================================================
    // PREPARE TOPIC DATA FOR SERVICE
    // ================================================================
    const topicData = {
      id: topic.id,
      name: topic.name,
      body: topic.body,
      aiSummary: topic.aiSummary,
      pdfS3Key: topic.pdfS3Key,
      pdfPageStart: topic.pdfPageStart,
      pdfPageEnd: topic.pdfPageEnd,
      subjectId: topic.subjectId,
      gradeLevel: topic.gradeLevel,
      topicQuestionsRemainingToGenerate:
        topic.topicQuestionsRemainingToGenerate,
      topicGeneralQuestionsStats: topic.topicGeneralQuestionsStats,
    };
    // ================================================================
    // FETCH SUBJECT CONTEXT
    // ================================================================
    let subjectContext = "General Subject";
    try {
      subjectContext = await QuestionGenerationService.fetchSubjectContext(
        Number(topic.subjectId || 0),
      );
    } catch (subjectError) { }
    // ================================================================
    // GENERATE QUESTIONS USING GEMINI AI
    // ================================================================
    const geminiStartTime = Date.now();
    try {
      // Split questions across complexity levels
      const easyCount = Math.ceil(toGenerate / 3);
      const mediumCount = Math.ceil(toGenerate / 3);
      const hardCount = Math.floor(toGenerate / 3);
      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error("Question generation timeout")),
          GEMINI_TIMEOUT_MS,
        );
      });
      // Race between generation and timeout
      const generatedQuestions = await Promise.race([
        QuestionGenerationService.generateQuestionsMultiComplexity({
          topicData,
          subjectContext,
          language: "azerbaijani",
          counts: {
            easy: easyCount,
            medium: mediumCount,
            hard: hardCount,
          },
          mode: "auto",
        }),
        timeoutPromise,
      ]);
      const geminiResponseTime = Date.now() - geminiStartTime;
      // ================================================================
      // SAVE QUESTIONS TO DATABASE
      // ================================================================
      const saveResult = await QuestionGenerationService.saveQuestions({
        generatedQuestions: generatedQuestions as any[],
        accountId: SYSTEM_ACCOUNT_ID,
        topicName: topic.name || "Untitled Topic",
        topicId: topic.id,
        subjectId: Number(topic.subjectId || 0),
        gradeLevel: Number(topic.gradeLevel || 5),
        language: "azerbaijani",
        modelName: "gemini-2.0-flash-exp",
        actionName: "background_job_question_generation",
      });
      const questionsGenerated = saveResult.savedQuestions.length;
      const newStats = currentStats + questionsGenerated;
      const totalProcessingTime = Date.now() - processingStartTime;
      // Log success
      await logTopicWorker({
        correlationId,
        topicId,
        status: "completed",
        questionsGenerated,
        processingTimeMs: totalProcessingTime,
        currentStats: newStats,
        capacity,
      });
      return NextResponse.json({
        success: true,
        topicId,
        questionsGenerated,
        currentStats: newStats,
        capacity,
      });
    } catch (geminiError) {
      const errorMessage =
        geminiError instanceof Error ? geminiError.message : "Unknown error";
      await logTopicWorker({
        correlationId,
        topicId,
        status: "failed",
        error: errorMessage,
        currentStats,
        capacity,
      });
      return NextResponse.json(
        {
          success: false,
          topicId,
          questionsGenerated: 0,
          currentStats,
          capacity,
          error: `Question generation error: ${errorMessage}`,
        },
        { status: 500 },
      );
    }
  },
);
/**
 * GET /api/workspaces/jobs/generate-topic-questions
 *
 * Health check endpoint
 */
export const GET: ApiRouteHandler = withApiHandler(
  async (request: NextRequest, { log }: ApiHandlerContext) => {
    return NextResponse.json({
      service: "Generate Topic Questions Worker",
      status: "healthy",
      timestamp: new Date().toISOString(),
      config: {
        geminiTimeout: GEMINI_TIMEOUT_MS,
        systemAccountId: SYSTEM_ACCOUNT_ID,
      },
    });
  },
);


