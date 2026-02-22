
import { unifiedApiHandler } from "@/lib/middleware/_Middleware.index";
import { z } from "zod";
import { okResponse, errorResponse, serverErrorResponse } from '@/lib/middleware/Response.Api.middleware';

const BulkQuestionsSchema = z.object({
  questions: z.array(z.object({
    questionText: z.string().min(1),
    options: z.array(z.string()).min(2),
    correctAnswer: z.union([z.string(), z.number()]),
    difficulty: z.string().optional(),
    explanation: z.string().optional(),
  })).min(1),
});

export const POST = unifiedApiHandler(async (request, { module, params, isValidSlimId, log, auth }) => {
  const subjectId = params?.id as string;
  const topicId = params?.topicId as string;

  if (!subjectId || !topicId || !isValidSlimId(subjectId) || !isValidSlimId(topicId)) {
    return errorResponse("Invalid subject ID or topic ID", 400);
  }

  try {
    const body = await request.json();

    const parsed = BulkQuestionsSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0]?.message || "Validation failed", 400);
    }

    // Validate Topic
    const topicResult = await module.topic.getDetail(topicId, subjectId);
    if (!topicResult.success || !topicResult.data) {
      return errorResponse("Topic not found or does not belong to subject", 404);
    }
    const topicData = topicResult.data;

    const questionsToSave = parsed.data.questions;
    const createdQuestions = [];
    const accountId = auth.accountId;

    for (const q of questionsToSave) {
      const questionData = {
        question: q.questionText,
        answers: q.options,
        correctAnswer: q.options[Number(q.correctAnswer)],
        providerSubjectId: subjectId,
        providerSubjectTopicId: topicId,
        complexity: (['easy', 'medium', 'hard', 'expert'].includes(q.difficulty || '') ? q.difficulty : 'medium') as 'easy' | 'medium' | 'hard' | 'expert',
        explanationGuide: q.explanation ? { content: String(q.explanation) } : undefined,
        gradeLevel: topicData.gradeLevel ? Number(topicData.gradeLevel) : 1,
        workspaceId: auth.activeWorkspaceId,
        isPublished: false,
      };

      const result = await module.question.create(questionData, accountId);
      if (result.success && result.data) {
        createdQuestions.push(result.data);
      }
    }

    if (createdQuestions.length > 0) {
      await module.topic.incrementQuestionStats(topicId, createdQuestions.length);
    }

    log.info("Questions added to topic", {
      subjectId,
      topicId,
      topicName: topicData.name,
      count: createdQuestions.length,
      accountId,
    });

    return okResponse({
      count: createdQuestions.length,
      questions: createdQuestions,
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    log.error("Failed to add questions to topic", {
      error: errorMessage,
      subjectId,
      topicId
    });

    return serverErrorResponse("Failed to add questions to topic");
  }
});
