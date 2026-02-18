import { NextRequest } from 'next/server';
import { unifiedApiHandler, type UnifiedContext } from "@/lib/middleware/handlers/ApiInterceptor";
import { QuestionGenerationService } from "@/lib/domain/question/question-generation.service";
import { createdResponse, errorResponse, serverErrorResponse } from '@/lib/middleware/responses/ApiResponse';

export const POST = unifiedApiHandler(
  async (request: NextRequest, { auth, log }: UnifiedContext) => {
    const accountId = auth.accountId;

    try {
      const body = await request.json();
      const {
        subject_id,
        grade_level,
        complexity,
        topic,
        topic_id,
        count = 1,
        language = "azerbaijani",
        mode = "text",
        comment,
        count_easy,
        count_medium,
        count_hard,
      } = body;

      log.info("Generating questions with AI", {
        subject_id,
        grade_level,
        topic,
        topic_id,
        count,
        language,
        mode,
      });

      // Validation
      if (!subject_id || !grade_level || !topic?.trim()) {
        return errorResponse("Subject, Grade level, and Topic are required", 400);
      }

      // Check if using per-complexity counts
      const useMultiComplexity =
        count_easy !== undefined ||
        count_medium !== undefined ||
        count_hard !== undefined;

      // ... existing validation logic ...
      if (useMultiComplexity) {
        const easyCount = count_easy || 0;
        const mediumCount = count_medium || 0;
        const hardCount = count_hard || 0;
        if (easyCount + mediumCount + hardCount === 0) {
          return errorResponse("Total count must be > 0", 400);
        }
      } else if (!complexity) {
        return errorResponse("Complexity is required", 400);
      }

      // Get subject context
      const subjectContext = await QuestionGenerationService.fetchSubjectContext(subject_id);

      // Fetch topic data
      let topicData: any = null;
      if (topic_id) {
        topicData = await QuestionGenerationService.fetchTopicById(topic_id);
        if (!topicData) {
          return errorResponse("Topic not found", 404, "NOT_FOUND");
        }
      } else {
        topicData = {
          id: null,
          name: topic,
          body: `Topic: ${topic}\nSubject: ${subjectContext.label}\nGrade Level: ${grade_level}`,
          aiSummary: null,
          pdfS3Key: null,
          gradeLevel: grade_level,
          subjectId: subject_id
        };
      }

      // Generate questions
      let generatedQuestions;

      // Fetch existing questions for dedup (only if topic_id exists)
      const existingQuestions = topic_id
        ? await QuestionGenerationService.fetchExistingQuestionTexts(topic_id)
        : [];

      if (useMultiComplexity) {
        generatedQuestions = await QuestionGenerationService.generateQuestionsMultiComplexity({
          topicData,
          subjectContext,
          language,
          counts: {
            easy: count_easy || 0,
            medium: count_medium || 0,
            hard: count_hard || 0,
          },
          mode: mode === "text" ? "text" : mode === "pdf" ? "pdf" : "auto",
          comment,
          existingQuestions,
        });
      } else {
        generatedQuestions = await QuestionGenerationService.generateQuestionsForTopic({
          topicData,
          subjectContext,
          complexity: complexity as "easy" | "medium" | "hard",
          language,
          count,
          mode: mode === "text" ? "text" : mode === "pdf" ? "pdf" : "auto",
          comment,
          existingQuestions,
        });
      }

      if (!generatedQuestions || generatedQuestions.length === 0) {
        return serverErrorResponse("AI did not generate any questions");
      }

      // Save questions
      const saveResult = await QuestionGenerationService.saveQuestions({
        generatedQuestions,
        accountId,
        topicId: topic_id || undefined,
        subjectId: subject_id,
        gradeLevel: grade_level,
        complexity: useMultiComplexity ? undefined : (complexity as "easy" | "medium" | "hard"),
        language,
      });

      return createdResponse(saveResult.savedQuestions, `Successfully generated ${saveResult.savedQuestions.length} question(s)`);
    } catch (error) {
      log.error("Error generating questions", error);
      return serverErrorResponse(error instanceof Error ? error.message : "Failed to generate questions");
    }
  },
);
