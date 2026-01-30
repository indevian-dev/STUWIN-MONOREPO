import type { ApiRouteHandler, ApiHandlerContext } from '@/types/next';
import { NextRequest, NextResponse } from 'next/server';
import { withApiHandler } from '@/lib/app-access-control/interceptors';
import { TOPICS } from '@/lib/app-infrastructure/database';
import { QuestionGenerationService } from '@/lib/app-core-modules/services/QuestionGenerationService';
/**
 * Webhook for Upstash Queue - AI Question Generation
 * Generates 30 questions per topic (3 complexity levels × 10 questions each)
 * 
 * Security: Set QUEUE_API_KEY in environment for validation
 * Triggered by: Upstash QStash Queue
 */
export const POST: ApiRouteHandler = withApiHandler(async (request: NextRequest, { log, db }: ApiHandlerContext) => {
  // Validate API key if configured
  const queueApiKey = process.env.QUEUE_API_KEY;
  if (queueApiKey) {
    const providedKey = request.headers.get('x-api-key');
    if (providedKey !== queueApiKey) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }
  }
  // System account ID for AI-generated questions
  const systemAccountId = 1;
  // Fetch topics with remaining questions > 0
  const topicsToProcess = await db.query(
    `SELECT * FROM ${TOPICS}
       WHERE isActiveForAi = true AND topicQuestionsRemainingToGenerate > 0
       LIMIT 5`
  ); // Process 5 topics per queue trigger
  if (topicsToProcess.length === 0) {
    return NextResponse.json({
      message: 'No topics to process',
      processed: 0
    }, { status: 200 });
  }
  const results = [];
  let totalGenerated = 0;
  // Process each topic
  for (const topic of topicsToProcess) {
    try {
      const remaining = topic.topicQuestionsRemainingToGenerate || 0;
      if (remaining <= 0) continue;
      // Fetch subject context
      const subjectContext = await QuestionGenerationService.fetchSubjectContext(
        Number(topic.subjectId || 0)
      );
      const language = 'azerbaijani';
      // Convert topic to TopicData format
      const topicData: import('@/lib/app-core-modules/services/QuestionGenerationService').TopicData = {
        id: topic.id,
        name: topic.name,
        body: topic.body,
        aiSummary: topic.aiSummary,
        pdfS3Key: topic.pdfS3Key,
        pdfPageStart: topic.pdfPageStart as number | null,
        pdfPageEnd: topic.pdfPageEnd as number | null,
        subjectId: topic.subjectId as number | null,
        gradeLevel: topic.gradeLevel as number | null,
        topicQuestionsRemainingToGenerate: topic.topicQuestionsRemainingToGenerate as number | null,
        topicGeneralQuestionsStats: topic.topicGeneralQuestionsStats as number | null,
      };
      // Generate questions for all complexity levels (easy, medium, hard)
      // Webhook always generates 10 per complexity (30 total)
      const allGeneratedQuestions = await QuestionGenerationService.generateQuestionsMultiComplexity({
        topicData,
        subjectContext,
        language,
        counts: {
          easy: 10,
          medium: 10,
          hard: 10
        },
        mode: 'auto'
        // No comment for webhook - only for manual generation
      });
      // Save questions and update topic stats
      const saveResult = await QuestionGenerationService.saveQuestions({
        generatedQuestions: allGeneratedQuestions,
        accountId: systemAccountId,
        topicName: topic.name || 'Untitled Topic',
        topicId: topic.id,
        subjectId: Number(topic.subjectId || 0),
        gradeLevel: Number(topic.gradeLevel || 5),
        complexity: 'medium', // Will be overridden per question
        language,
        modelName: 'gemini-2.0-flash-exp',
        actionName: 'webhook_ai_generate_question'
      });
      totalGenerated += saveResult.savedQuestions.length;
      // Calculate breakdown by complexity
      const breakdown = {
        easy: saveResult.savedQuestions.filter(q => q.complexity === 'easy').length,
        medium: saveResult.savedQuestions.filter(q => q.complexity === 'medium').length,
        hard: saveResult.savedQuestions.filter(q => q.complexity === 'hard').length,
      };
      results.push({
        topicId: topic.id,
        topicName: topic.name,
        questionsGenerated: saveResult.savedQuestions.length,
        breakdown,
        success: true
      });
    } catch (topicError) {
      const errorMessage = topicError instanceof Error ? topicError.message : 'Unknown error';
      results.push({
        topicId: topic.id,
        topicName: topic.name,
        error: errorMessage,
        success: false
      });
    }
  }
  return NextResponse.json({
    message: 'Queue processing completed',
    topicsProcessed: results.length,
    totalQuestionsGenerated: totalGenerated,
    results
  }, { status: 200 });
});
// Health check endpoint
export const GET: ApiRouteHandler = withApiHandler(async (request: NextRequest, { log, db }: ApiHandlerContext) => {
  return NextResponse.json({
    service: 'Questions Generator Webhook',
    status: 'healthy',
    timestamp: new Date().toISOString()
  }, { status: 200 });
});


