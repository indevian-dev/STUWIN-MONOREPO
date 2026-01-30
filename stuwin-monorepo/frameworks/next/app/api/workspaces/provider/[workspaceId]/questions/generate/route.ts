import type { NextRequest } from "next/server";
import type { ApiRouteHandler, ApiHandlerContext } from "@/types/next";
import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/app-access-control/interceptors";
import { QuestionGenerationService } from "@/lib/app-core-modules/services/QuestionGenerationService";

export const POST: ApiRouteHandler = withApiHandler(
  async (request: NextRequest, { authData, log }: ApiHandlerContext) => {
    if (!authData) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accountId = authData.account.id;

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
        comment, // Optional AI prompt enhancement
        // Per-complexity counts (if provided, overrides single count)
        count_easy,
        count_medium,
        count_hard,
      } = body;

      log.info("Generating questions with AI", {
        subject_id,
        grade_level,
        complexity,
        topic,
        topic_id,
        count,
        count_easy,
        count_medium,
        count_hard,
        language,
        mode,
        has_comment: !!comment,
      });

      // Validation
      if (!subject_id) {
        return NextResponse.json(
          { error: "Subject is required" },
          { status: 400 },
        );
      }
      if (!grade_level) {
        return NextResponse.json(
          { error: "Grade level is required" },
          { status: 400 },
        );
      }
      if (!topic?.trim()) {
        return NextResponse.json(
          { error: "Topic is required" },
          { status: 400 },
        );
      }

      // Check if using per-complexity counts or single count
      const useMultiComplexity =
        count_easy !== undefined ||
        count_medium !== undefined ||
        count_hard !== undefined;

      if (useMultiComplexity) {
        // Validate per-complexity counts
        const easyCount = count_easy || 0;
        const mediumCount = count_medium || 0;
        const hardCount = count_hard || 0;

        if (easyCount < 0 || easyCount > 10) {
          return NextResponse.json(
            { error: "Easy count must be between 0 and 10" },
            { status: 400 },
          );
        }
        if (mediumCount < 0 || mediumCount > 10) {
          return NextResponse.json(
            { error: "Medium count must be between 0 and 10" },
            { status: 400 },
          );
        }
        if (hardCount < 0 || hardCount > 10) {
          return NextResponse.json(
            { error: "Hard count must be between 0 and 10" },
            { status: 400 },
          );
        }

        if (easyCount + mediumCount + hardCount === 0) {
          return NextResponse.json(
            { error: "At least one complexity level must have a count > 0" },
            { status: 400 },
          );
        }
      } else {
        // Validate single complexity mode
        if (!complexity) {
          return NextResponse.json(
            {
              error:
                "Complexity is required when not using per-complexity counts",
            },
            { status: 400 },
          );
        }
        if (count < 1 || count > 10) {
          return NextResponse.json(
            { error: "Count must be between 1 and 10" },
            { status: 400 },
          );
        }
      }

      const validLanguages = ["azerbaijani", "russian", "english"];
      if (!language || !validLanguages.includes(language.toLowerCase())) {
        return NextResponse.json(
          { error: "Language must be one of: azerbaijani, russian, english" },
          { status: 400 },
        );
      }

      const validModes = ["text", "pdf", "image"];
      if (!mode || !validModes.includes(mode.toLowerCase())) {
        return NextResponse.json(
          { error: "Mode must be one of: text, pdf, image" },
          { status: 400 },
        );
      }

      // Get subject context
      const subjectContext =
        await QuestionGenerationService.fetchSubjectContext(subject_id);

      // If topic_id is provided, fetch topic data
      let topicData:
        | import("@/lib/app-core-modules/services/QuestionGenerationService").TopicData
        | null = null;

      if (topic_id) {
        topicData = await QuestionGenerationService.fetchTopicById(topic_id);

        if (!topicData) {
          return NextResponse.json(
            { error: "Topic not found" },
            { status: 404 },
          );
        }

        // Check mode compatibility
        if (mode === "pdf" && !topicData.pdfS3Key) {
          return NextResponse.json(
            {
              error:
                "Topic has no PDF content. Please select text or image mode.",
            },
            { status: 400 },
          );
        }

        if (mode === "image") {
          log.warn("Image mode not yet fully implemented, using text mode");
        }
      } else {
        // Create minimal topic data for non-topic-based generation
        topicData = {
          id: 0,
          name: topic,
          body: `Topic: ${topic}\nSubject: ${subjectContext}\nGrade Level: ${grade_level}`,
          aiSummary: null,
          pdfS3Key: null,
          pdfPageStart: null,
          pdfPageEnd: null,
          subjectId: subject_id,
          gradeLevel: grade_level,
          topicQuestionsRemainingToGenerate: null,
          topicGeneralQuestionsStats: null,
        };
      }

      // Generate questions using the centralized service
      let generatedQuestions;
      try {
        if (useMultiComplexity) {
          // Generate questions for multiple complexity levels
          generatedQuestions =
            await QuestionGenerationService.generateQuestionsMultiComplexity({
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

          log.info("Gemini generated questions (multi-complexity)", {
            total: generatedQuestions.length,
            easy: count_easy || 0,
            medium: count_medium || 0,
            hard: count_hard || 0,
            mode,
          });
        } else {
          // Single complexity generation
          generatedQuestions =
            await QuestionGenerationService.generateQuestionsFromTopic({
              topicData,
              subjectContext,
              complexity: complexity as "easy" | "medium" | "hard",
              language,
              count,
              mode: mode === "text" ? "text" : mode === "pdf" ? "pdf" : "auto",
              comment,
            });

          log.info("Gemini generated questions", {
            count: generatedQuestions.length,
            complexity,
            mode,
          });
        }
      } catch (geminiError) {
        log.error("Gemini generation failed", geminiError as Error);

        const errorMessage =
          geminiError instanceof Error ? geminiError.message : "Unknown error";

        // Handle specific errors
        if (errorMessage.includes("rate limit")) {
          return NextResponse.json(
            {
              error: "Gemini API rate limit exceeded. Please try again later.",
            },
            { status: 429 },
          );
        }
        if (errorMessage.includes("invalid") || errorMessage.includes("key")) {
          return NextResponse.json(
            { error: "Gemini API configuration error" },
            { status: 500 },
          );
        }

        return NextResponse.json(
          { error: "Failed to generate questions with Gemini" },
          { status: 500 },
        );
      }

      // Validate we have questions
      if (!generatedQuestions || generatedQuestions.length === 0) {
        return NextResponse.json(
          { error: "AI did not generate any questions" },
          { status: 500 },
        );
      }

      // Save questions using the centralized service
      const saveResult = await QuestionGenerationService.saveQuestions({
        generatedQuestions,
        accountId,
        topicName: topic,
        topicId: topic_id || undefined,
        subjectId: subject_id,
        gradeLevel: grade_level,
        complexity: useMultiComplexity
          ? undefined
          : (complexity as "easy" | "medium" | "hard"),
        language,
        modelName: "gemini-2.0-flash-exp",
        actionName: "ai_generate_question",
      });

      log.info("Questions generated and saved", {
        count: saveResult.savedQuestions.length,
        topicId: topic_id,
        topicStatsUpdated: saveResult.topicStatsUpdated,
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
      const errorMessage =
        error instanceof Error ? error.message : "Failed to generate questions";
      log.error("Error generating questions", error as Error);

      if (error && typeof error === "object" && "status" in error) {
        const statusCode = (error as any).status;
        if (statusCode === 429) {
          return NextResponse.json(
            { error: "Gemini API rate limit exceeded" },
            { status: 429 },
          );
        }
        if (statusCode === 401) {
          return NextResponse.json(
            { error: "Gemini API key is invalid" },
            { status: 500 },
          );
        }
      }

      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
  },
);
