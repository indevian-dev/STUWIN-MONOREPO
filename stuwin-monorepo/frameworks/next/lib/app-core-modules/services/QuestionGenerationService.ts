import { db } from "@/lib/app-infrastructure/database";
import {
    providerSubjects,
    providerSubjectTopics,
    providerQuestions as questions,
} from "@/lib/app-infrastructure/database/schema";
import { eq, sql } from "drizzle-orm";
import {
    generateQuestionsWithGemini,
    generateQuestionsWithGeminiText,
} from "@/lib/utils/geminiPdfProcessorUtility";
import { ConsoleLogger } from "@/lib/app-infrastructure/loggers/ConsoleLogger";

export interface TopicData {
    id: any;
    name: string | null;
    body: string | null;
    aiSummary: string | null;
    pdfS3Key: string | null;
    pdfPageStart: number | null;
    pdfPageEnd: number | null;
    subjectId: any | null;
    gradeLevel: number | null;
    topicQuestionsRemainingToGenerate: number | null;
    topicGeneralQuestionsStats: number | null;
}

export class QuestionGenerationService {
    /**
     * Fetch subject context (name, description, etc.)
     */
    static async fetchSubjectContext(
        subjectId: string | number
    ): Promise<string> {
        try {
            const subject = await (db.query as any).providerSubjects.findFirst({
                where: eq(providerSubjects.id, String(subjectId)),
            });

            if (!subject) return "General Subject";

            return `${subject.name} (Grade ${subject.gradeLevel})`;
        } catch (error) {
            ConsoleLogger.error("Failed to fetch subject context", error);
            return "General Subject";
        }
    }

    /**
     * Fetch topic data by ID
     */
    static async fetchTopicById(topicId: string | number): Promise<TopicData | null> {
        try {
            const topic = await (db.query as any).providerSubjectTopics.findFirst({
                where: eq(providerSubjectTopics.id, String(topicId)),
            });

            if (!topic) return null;

            return {
                id: topic.id,
                name: topic.name,
                body: topic.description, // Mapping description to body for AI context
                aiSummary: topic.aiSummary,
                pdfS3Key: topic.pdfS3Key,
                pdfPageStart: topic.pdfPageStart,
                pdfPageEnd: topic.pdfPageEnd,
                subjectId: topic.providerSubjectId,
                gradeLevel: topic.gradeLevel,
                topicQuestionsRemainingToGenerate: topic.topicQuestionsRemainingToGenerate,
                topicGeneralQuestionsStats: topic.topicGeneralQuestionsStats,
            };
        } catch (error) {
            ConsoleLogger.error("Failed to fetch topic", error);
            return null;
        }
    }

    /**
     * Generate questions with single complexity
     */
    static async generateQuestionsForTopic({
        topicData,
        subjectContext,
        complexity,
        language,
        count,
        mode = "auto",
        comment,
    }: {
        topicData: TopicData;
        subjectContext: string;
        complexity: "easy" | "medium" | "hard";
        language: string;
        count: number;
        mode?: "text" | "pdf" | "auto";
        comment?: string;
    }) {
        // Determine generation mode
        let generationMode = mode;
        if (mode === "auto") {
            generationMode = topicData.pdfS3Key ? "pdf" : "text";
        }

        // Default params
        const options = {
            topic: topicData.name || "Unknown Topic",
            subject: subjectContext,
            gradeLevel: String(topicData.gradeLevel || 10),
            complexity,
            language,
            count,
            comment,
        };

        if (generationMode === "pdf" && topicData.pdfS3Key) {
            // PDF Mode
            const result = await generateQuestionsWithGemini(topicData.pdfS3Key, {
                ...options,
                pageStart: topicData.pdfPageStart || 1,
                pageEnd: topicData.pdfPageEnd || 1,
            });
            return result.questions;
        } else {
            // Text Mode (fallback if PDF missing or text mode explicitly requested)
            const textContent =
                topicData.aiSummary || topicData.body || `Topic: ${topicData.name}`;

            const result = await generateQuestionsWithGeminiText(textContent, options);
            return result.questions;
        }
    }

    /**
     * Generate questions for multiple complexities
     */
    static async generateQuestionsMultiComplexity({
        topicData,
        subjectContext,
        language,
        counts,
        mode = "auto",
        comment,
    }: {
        topicData: TopicData;
        subjectContext: string;
        language: string;
        counts: { easy: number; medium: number; hard: number };
        mode?: "text" | "pdf" | "auto";
        comment?: string;
    }) {
        const results = [];

        // Run in parallel for efficiency
        const promises = [];

        if (counts.easy > 0) {
            promises.push(
                this.generateQuestionsForTopic({
                    topicData,
                    subjectContext,
                    complexity: "easy",
                    language,
                    count: counts.easy,
                    mode,
                    comment,
                }).then((questions) =>
                    questions.map((q) => ({ ...q, complexity: "easy" }))
                )
            );
        }

        if (counts.medium > 0) {
            promises.push(
                this.generateQuestionsForTopic({
                    topicData,
                    subjectContext,
                    complexity: "medium",
                    language,
                    count: counts.medium,
                    mode,
                    comment,
                }).then((questions) =>
                    questions.map((q) => ({ ...q, complexity: "medium" }))
                )
            );
        }

        if (counts.hard > 0) {
            promises.push(
                this.generateQuestionsForTopic({
                    topicData,
                    subjectContext,
                    complexity: "hard",
                    language,
                    count: counts.hard,
                    mode,
                    comment,
                }).then((questions) =>
                    questions.map((q) => ({ ...q, complexity: "hard" }))
                )
            );
        }

        const responses = await Promise.all(promises);
        return responses.flat();
    }

    /**
     * Save generated questions to database
     */
    static async saveQuestions({
        generatedQuestions,
        accountId,
        topicName,
        topicId,
        subjectId,
        gradeLevel,
        complexity,
        language,
        modelName = "gemini-2.0-flash-exp",
        actionName = "ai_generate_question",
    }: {
        generatedQuestions: any[];
        accountId: string | number;
        topicName: string;
        topicId?: string | number;
        subjectId?: string | number;
        gradeLevel?: number;
        complexity?: "easy" | "medium" | "hard";
        language: string;
        modelName?: string;
        actionName?: string;
    }) {
        if (!generatedQuestions.length) return { savedQuestions: [], topicStatsUpdated: false };

        let finalTopicName = topicName;
        let finalSubjectName = "Unknown Subject";
        let finalChapterNumber: string | undefined = undefined;

        // Fetch missing context info
        try {
            if (subjectId) {
                const subject = await (db.query as any).providerSubjects.findFirst({
                    where: eq(providerSubjects.id, String(subjectId)),
                });
                if (subject) finalSubjectName = subject.name;
            }

            if (topicId) {
                const topic = await (db.query as any).providerSubjectTopics.findFirst({
                    where: eq(providerSubjectTopics.id, String(topicId)),
                });
                if (topic) {
                    finalTopicName = topic.name;
                    finalChapterNumber = topic.chapterNumber;
                }
            }
        } catch (err) {
            ConsoleLogger.error("Error fetching context for question snapshot", err);
        }

        const questionsToInsert = generatedQuestions.map((q) => ({
            question: q.question,
            answers: q.answers,
            correctAnswer: q.correct_answer,
            authorAccountId: String(accountId),
            providerSubjectTopicId: topicId ? String(topicId) : null,
            providerSubjectId: subjectId ? String(subjectId) : null,
            gradeLevel: gradeLevel || null,
            complexity: q.complexity || complexity, // Use individual Q complexity or global fallback
            language,
            isPublished: true, // Auto-publish for now
            explanationGuide: { model: modelName, action: actionName },
            context: {
                subjectName: finalSubjectName,
                topicName: finalTopicName,
                chapterNumber: finalChapterNumber
            }
        }));

        const savedQuestions = await db
            .insert(questions)
            .values(questionsToInsert)
            .returning();

        // Update topic stats if topicId is provided
        let topicStatsUpdated = false;
        if (topicId) {
            try {
                await db
                    .update(providerSubjectTopics)
                    .set({
                        topicGeneralQuestionsStats: sql`${providerSubjectTopics.topicGeneralQuestionsStats} + ${savedQuestions.length}`,
                        topicQuestionsRemainingToGenerate: sql`GREATEST(${providerSubjectTopics.topicQuestionsRemainingToGenerate} - ${savedQuestions.length}, 0)`,
                        // If remaining goes to 0, disable AI generation for this topic
                        isActiveForAi: sql`CASE WHEN GREATEST(${providerSubjectTopics.topicQuestionsRemainingToGenerate} - ${savedQuestions.length}, 0) <= 0 THEN false ELSE ${providerSubjectTopics.isActiveForAi} END`
                    })
                    .where(eq(providerSubjectTopics.id, String(topicId)));

                topicStatsUpdated = true;
            } catch (err) {
                ConsoleLogger.error("Failed to update topic stats", err);
            }
        }

        return { savedQuestions, topicStatsUpdated };
    }
}
