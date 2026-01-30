import type { NextRequest } from "next/server";
import type { ApiRouteHandler, ApiHandlerContext } from "@/types/next";
import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/app-access-control/interceptors";
import { TOPICS } from "@/lib/app-infrastructure/database";
import { QuestionGenerationService } from "@/lib/app-core-modules/services/QuestionGenerationService";
/**
 * Webhook for processing question generation queue
 * Fetches topics with remaining questions > 0 and is_active_for_ai = true
 * Generates questions and updates topic stats
 * PUBLIC ENDPOINT - No authentication required for queue service
 * Optional: Set QUEUE_API_KEY environment variable for additional security
 */
export const POST: ApiRouteHandler = withApiHandler(
  async (request: NextRequest, { authData, log, db }: ApiHandlerContext) => {
    // Optional API key check for queue service
    const queueApiKey = process.env.QUEUE_API_KEY;
    if (queueApiKey) {
      const providedKey = request.headers.get("x-api-key");
      if (providedKey !== queueApiKey) {
        return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
      }
    }
    // Use system account ID for queue-generated questions
    // If authData exists, use it; otherwise use system account (ID: 1)
    const accountId = authData?.account?.id ?? 1;
    try {
      // Fetch topics that need question generation
      const topicsToProcess = await db.query(
        `SELECT * FROM ${TOPICS}
         WHERE isActiveForAi = true AND topicQuestionsRemainingToGenerate > 0
         LIMIT 10`
      ); // Process up to 10 topics per queue trigger
      if (topicsToProcess.length === 0) {
        return NextResponse.json(
          {
            message: "No topics to process",
            processed: 0,
          },
          { status: 200 },
        );
      }
      const results = [];
      let totalGenerated = 0;
      // Process each topic
      for (const topic of topicsToProcess) {
        try {
          const remaining = topic.topicQuestionsRemainingToGenerate || 0;
          if (remaining <= 0) continue;
          // Determine batch size (at least 10 questions per batch, or remaining if less)
          const batchSize = Math.min(remaining, 10);
          // Fetch subject context
          const subjectContext =
            await QuestionGenerationService.fetchSubjectContext(
              Number(topic.subjectId || 0),
            );
          const language = "azerbaijani";
          // Convert topic to TopicData format
          const topicData: import("@/lib/app-core-modules/services/QuestionGenerationService").TopicData =
          {
            id: topic.id,
            name: topic.name,
            body: topic.body,
            aiSummary: topic.aiSummary,
            pdfS3Key: topic.pdfS3Key,
            pdfPageStart: topic.pdfPageStart as number | null,
            pdfPageEnd: topic.pdfPageEnd as number | null,
            subjectId: topic.subjectId as number | null,
            gradeLevel: topic.gradeLevel as number | null,
            topicQuestionsRemainingToGenerate:
              topic.topicQuestionsRemainingToGenerate as number | null,
            topicGeneralQuestionsStats: topic.topicGeneralQuestionsStats as
              | number
              | null,
          };
          // Generate questions (medium complexity by default for queue)
          const generatedQuestions =
            await QuestionGenerationService.generateQuestionsFromTopic({
              topicData,
              subjectContext,
              complexity: "medium",
              language,
              count: batchSize,
              mode: "auto",
            });
          // Save questions and update topic stats
          const saveResult = await QuestionGenerationService.saveQuestions({
            generatedQuestions,
            accountId,
            topicName: topic.name || "Untitled Topic",
            topicId: topic.id,
            subjectId: Number(topic.subjectId || 0),
            gradeLevel: Number(topic.gradeLevel || 5),
            complexity: "medium",
            language,
            modelName: "gemini-2.0-flash-exp",
            actionName: "ai_queue_generate_question",
          });
          totalGenerated += saveResult.savedQuestions.length;
          results.push({
            topicId: topic.id,
            topicName: topic.name,
            questionsGenerated: saveResult.savedQuestions.length,
            remaining:
              (topic.topicQuestionsRemainingToGenerate || 0) -
              saveResult.savedQuestions.length,
          });
        } catch (topicError) {
          results.push({
            topicId: topic.id,
            topicName: topic.name,
            error: "Failed to process topic",
          });
        }
      }
      return NextResponse.json(
        {
          message: "Queue processing completed",
          topicsProcessed: results.length,
          totalQuestionsGenerated: totalGenerated,
          results,
        },
        { status: 200 },
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to process queue";
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
  },
);
