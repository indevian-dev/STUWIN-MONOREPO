import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { unifiedApiHandler } from "@/lib/app-access-control/interceptors";
import { ValidationService, Rules } from "@/lib/app-core-modules/services/ValidationService";

export const POST = unifiedApiHandler(async (request, { module, params, isValidSlimId, log, auth }) => {
  const subjectId = params?.id as string;
  const topicId = params?.topicId as string;

  if (!subjectId || !topicId || !isValidSlimId(subjectId) || !isValidSlimId(topicId)) {
    return NextResponse.json(
      { success: false, error: "Invalid subject ID or topic ID" },
      { status: 400 },
    );
  }

  try {
    const body = await request.json();

    // Validate input
    const validation = ValidationService.validate(body, {
      questions: {
        rules: [
          Rules.required("questions"),
          Rules.array("questions"),
          Rules.arrayMinLength("questions", 1),
        ],
      },
    });

    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: validation.firstError?.message || "Validation failed",
        },
        { status: 400 },
      );
    }

    // Validate Topic
    const topicResult = await module.learning.getTopicDetail(topicId, subjectId);
    if (!topicResult.success || !topicResult.data) {
      return NextResponse.json({ success: false, error: "Topic not found or does not belong to subject" }, { status: 404 });
    }
    const topicData = topicResult.data;

    // We no longer need to check for Subject separately as topic detail validation covers the relation
    // We also trust Auth context for Account existence at this stage

    const questionsToSave = body.questions;
    const createdQuestions = [];
    const accountId = auth.accountId;

    for (const q of questionsToSave) {
      const questionData = {
        question: q.questionText,
        answers: q.options,
        correctAnswer: q.options[Number(q.correctAnswer)],
        learningSubjectId: subjectId,
        learningSubjectTopicId: topicId, // Ensure schema supports this link if needed, otherwise rely on subject
        complexity: String(q.difficulty || "medium"),
        explanationGuide: q.explanation ? { text: String(q.explanation) } : null,
        gradeLevel: topicData.gradeLevel ? Number(topicData.gradeLevel) : null,
        workspaceId: auth.activeWorkspaceId,
        isPublished: false,
        // topic: topicData.name, // If 'topic' field exists in DB stringly-typed
      };

      const result = await module.learning.createQuestion(questionData, accountId);
      if (result.success && result.data) {
        createdQuestions.push(result.data);
      }
    }

    // Update stats - this could be moved to service but keeping here for now or if createQuestion handles it internally?
    // Ideally createQuestion should handle stats update or we call a specific method
    // For now, let's assume we proceed without explicit stat update or rely on triggers/future implementation
    // But since the original code did it, we should probably check if we can do it safely.
    // The original code used: UPDATE ... SET topicGeneralQuestionsStats ...
    // Let's implement incrementTopicQuestionCount in service for cleanliness.

    if (createdQuestions.length > 0) {
      await module.learning.incrementTopicQuestionStats(topicId, createdQuestions.length);
    }

    log.info("Questions added to topic", {
      subjectId,
      topicId,
      topicName: topicData.name,
      count: createdQuestions.length,
      accountId,
    });

    return NextResponse.json({
      success: true,
      data: {
        count: createdQuestions.length,
        questions: createdQuestions,
      },
    });

  } catch (error: any) {
    log.error("Failed to add questions to topic", {
      error: error.message,
      stack: error.stack,
      subjectId,
      topicId
    });

    return NextResponse.json(
      {
        success: false,
        error: "Failed to add questions to topic",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 },
    );
  }
});
