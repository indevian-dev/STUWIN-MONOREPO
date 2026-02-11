import { db } from "@/lib/database";
import {
    providerSubjects,
    providerSubjectTopics,
    providerQuestions as questions,
} from "@/lib/database/schema";
import { eq, sql } from "drizzle-orm";
import {
    generateQuestionsWithGemini,
    generateQuestionsWithGeminiText,
} from "@/lib/integrations/google/GeminiPdfProcessor";
import { ConsoleLogger } from "@/lib/logging/ConsoleLogger";

export interface TopicData {
    id: string;
    name: string | null;
    body: string | null;
    aiSummary: string | null;
    pdfS3Key: string | null;
    pdfPageStart: number | null;
    pdfPageEnd: number | null;
    subjectId: string | null;
    gradeLevel: number | null;
    topicQuestionsRemainingToGenerate: number | null;
    topicGeneralQuestionsStats: number | null;
    aiAssistantCrib: string | null;
}

export interface GeneratedQuestion {
    question: string;
    answers: string[];
    correct_answer: string;
    complexity?: "easy" | "medium" | "hard";
    explanation?: string;
}

export class QuestionGenerationService {
    /**
     * Fetch subject context (name, description, crib)
     */
    static async fetchSubjectContext(
        subjectId: string | number
    ): Promise<{ label: string; crib: string | null }> {
        try {
            const subject = await db.query.providerSubjects.findFirst({
                where: eq(providerSubjects.id, String(subjectId)),
            });

            if (!subject) return { label: "General Subject", crib: null };

            return {
                label: `${subject.name} (Grade ${subject.gradeLevel})`,
                crib: subject.aiAssistantCrib || null,
            };
        } catch (error) {
            ConsoleLogger.error("Failed to fetch subject context", error);
            return { label: "General Subject", crib: null };
        }
    }

    /**
     * Fetch topic data by ID
     */
    static async fetchTopicById(topicId: string | number): Promise<TopicData | null> {
        try {
            const topic = await db.query.providerSubjectTopics.findFirst({
                where: eq(providerSubjectTopics.id, String(topicId)),
            });

            if (!topic) return null;

            return {
                id: topic.id,
                name: topic.name,
                body: topic.description, // Mapping description to body for AI context
                aiSummary: topic.aiSummary,
                pdfS3Key: topic.pdfDetails?.s3Key || null,
                pdfPageStart: topic.pdfDetails?.pageStart || null,
                pdfPageEnd: topic.pdfDetails?.pageEnd || null,
                subjectId: topic.providerSubjectId,
                gradeLevel: (topic.gradeLevel as number) || null, // Ensure number type if bigint
                topicQuestionsRemainingToGenerate: topic.questionsStats?.remaining || 0,
                topicGeneralQuestionsStats: topic.questionsStats?.total || 0,
                aiAssistantCrib: topic.aiAssistantCrib || null,
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
        subjectContext: string | { label: string; crib: string | null };
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

        // Build combined crib from subject + topic
        const cribParts: string[] = [];
        if (typeof subjectContext === 'object' && subjectContext.crib) cribParts.push(`[Subject Crib] ${subjectContext.crib}`);
        if (topicData.aiAssistantCrib) cribParts.push(`[Topic Crib] ${topicData.aiAssistantCrib}`);
        const assistantCrib = cribParts.length > 0 ? cribParts.join('\n') : undefined;

        // Default params
        const subjectLabel = typeof subjectContext === 'object' ? subjectContext.label : subjectContext;
        const options = {
            topic: topicData.name || "Unknown Topic",
            subject: subjectLabel,
            gradeLevel: String(topicData.gradeLevel || 10),
            complexity,
            language,
            count,
            comment,
            assistantCrib,
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
        subjectContext: string | { label: string; crib: string | null };
        language: string;
        counts: { easy: number; medium: number; hard: number };
        mode?: "text" | "pdf" | "auto";
        comment?: string;
    }) {
        // const results = [];

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
        generatedQuestions: GeneratedQuestion[];
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
                const subject = await db.query.providerSubjects.findFirst({
                    where: eq(providerSubjects.id, String(subjectId)),
                });
                if (subject) finalSubjectName = subject.name || "Unknown Subject";
            }

            if (topicId) {
                const topic = await db.query.providerSubjectTopics.findFirst({
                    where: eq(providerSubjectTopics.id, String(topicId)),
                });
                if (topic) {
                    finalTopicName = topic.name || "Unknown Topic";
                    finalChapterNumber = topic.pdfDetails?.chapterNumber;
                }
            }
        } catch (err) {
            ConsoleLogger.error("Error fetching context for question snapshot", err);
        }

        // Build combined crib for each saved question
        let combinedCrib: string | null = null;
        try {
            const cribParts: string[] = [];
            if (subjectId) {
                const subj = await db.query.providerSubjects.findFirst({ where: eq(providerSubjects.id, String(subjectId)) });
                if (subj?.aiAssistantCrib) cribParts.push(subj.aiAssistantCrib);
            }
            if (topicId) {
                const t = await db.query.providerSubjectTopics.findFirst({ where: eq(providerSubjectTopics.id, String(topicId)) });
                if (t?.aiAssistantCrib) cribParts.push(t.aiAssistantCrib);
            }
            if (cribParts.length > 0) combinedCrib = cribParts.join('\n');
        } catch (err) {
            ConsoleLogger.error("Error fetching crib for question", err);
        }

        const questionsToInsert = generatedQuestions.map((q) => ({
            question: q.question,
            answers: q.answers,
            correctAnswer: q.correct_answer,
            authorAccountId: String(accountId),
            providerSubjectTopicId: topicId ? String(topicId) : null,
            providerSubjectId: subjectId ? String(subjectId) : null,
            gradeLevel: gradeLevel || null,
            complexity: q.complexity || complexity,
            language,
            isPublished: true,
            explanationGuide: { model: modelName, action: actionName },
            aiAssistantCrib: combinedCrib,
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
                // Update topic stats
                // We need to safely handle the JSONB structure updates
                await db
                    .update(providerSubjectTopics)
                    .set({
                        questionsStats: sql`jsonb_set(
                            jsonb_set(
                                COALESCE(${providerSubjectTopics.questionsStats}, '{}'::jsonb),
                                '{total}',
                                (COALESCE((${providerSubjectTopics.questionsStats}->>'total')::int, 0) + ${savedQuestions.length})::text::jsonb
                            ),
                            '{remaining}',
                            (GREATEST(COALESCE((${providerSubjectTopics.questionsStats}->>'remaining')::int, 0) - ${savedQuestions.length}, 0))::text::jsonb
                        )`,
                        isActiveAiGeneration: sql`
                            CASE 
                                WHEN GREATEST(COALESCE((${providerSubjectTopics.questionsStats}->>'remaining')::int, 0) - ${savedQuestions.length}, 0) <= 0 THEN false 
                                ELSE ${providerSubjectTopics.isActiveAiGeneration} 
                            END
                        `
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
