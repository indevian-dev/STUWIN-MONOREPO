import { NextRequest, NextResponse } from "next/server";
import { unifiedApiHandler, type UnifiedContext } from "@/lib/app-access-control/interceptors/ApiInterceptor";
import { QuestionGenerationService } from "@/lib/app-core-modules/services/QuestionGenerationService";

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
        return NextResponse.json(
          { error: "Subject, Grade level, and Topic are required" },
          { status: 400 },
        );
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
          return NextResponse.json({ error: "Total count must be > 0" }, { status: 400 });
        }
      } else if (!complexity) {
        return NextResponse.json({ error: "Complexity is required" }, { status: 400 });
      }

      // Get subject context
      const subjectContext = await QuestionGenerationService.fetchSubjectContext(subject_id);

      // Fetch topic data
      let topicData: any = null;
      if (topic_id) {
        topicData = await QuestionGenerationService.fetchTopicById(topic_id);
        if (!topicData) {
          return NextResponse.json({ error: "Topic not found" }, { status: 404 });
        }
      } else {
        topicData = {
          id: null,
          name: topic,
          body: `Topic: ${topic}\nSubject: ${subjectContext}\nGrade Level: ${grade_level}`,
          aiSummary: null,
          pdfS3Key: null,
          gradeLevel: grade_level,
          subjectId: subject_id
        };
      }

      // Generate questions
      let generatedQuestions;
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
        });
      }

      if (!generatedQuestions || generatedQuestions.length === 0) {
        return NextResponse.json({ error: "AI did not generate any questions" }, { status: 500 });
      }

      // Save questions
      const saveResult = await QuestionGenerationService.saveQuestions({
        generatedQuestions,
        accountId,
        topicName: topic,
        topicId: topic_id || undefined,
        subjectId: subject_id,
        gradeLevel: grade_level,
        complexity: useMultiComplexity ? undefined : (complexity as "easy" | "medium" | "hard"),
        language,
      });

      return NextResponse.json(
        {
          message: `Successfully generated ${saveResult.savedQuestions.length} question(s)`,
          questions: saveResult.savedQuestions,
          topicStatsUpdated: saveResult.topicStatsUpdated,
        },
        { status: 201 },
      );
    } catch (error) {
      log.error("Error generating questions", error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Failed to generate questions" },
        { status: 500 },
      );
    }
  },
);
