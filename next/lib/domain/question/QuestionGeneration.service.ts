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
import { ConsoleLogger } from "@/lib/logging/Console.logger";

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
    aiGuide: string | null;
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
                crib: subject.aiGuide || null,
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
                pdfPageStart: topic.pdfDetails?.pages?.start || null,
                pdfPageEnd: topic.pdfDetails?.pages?.end || null,
                subjectId: topic.providerSubjectId,
                gradeLevel: (topic.gradeLevel as number) || null, // Ensure number type if bigint
                topicQuestionsRemainingToGenerate: topic.questionsStats?.remaining || 0,
                topicGeneralQuestionsStats: topic.questionsStats?.total || 0,
                aiGuide: topic.aiGuide || null,
            };
        } catch (error) {
            ConsoleLogger.error("Failed to fetch topic", error);
            return null;
        }
    }

    /**
     * Fetch existing question texts for a topic (for dedup)
     * Returns only the question text — no answers or metadata
     */
    static async fetchExistingQuestionTexts(topicId: string | number): Promise<string[]> {
        try {
            const rows = await db
                .select({ question: questions.question })
                .from(questions)
                .where(eq(questions.providerSubjectTopicId, String(topicId)))
                .limit(200);

            return rows.map((r) => r.question).filter((q): q is string => !!q);
        } catch (error) {
            ConsoleLogger.error("Failed to fetch existing questions for dedup", error);
            return [];
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
        existingQuestions,
    }: {
        topicData: TopicData;
        subjectContext: string | { label: string; crib: string | null };
        complexity: "easy" | "medium" | "hard";
        language: string;
        count: number;
        mode?: "text" | "pdf" | "auto";
        comment?: string;
        existingQuestions?: string[];
    }) {
        // Determine generation mode
        let generationMode = mode;
        if (mode === "auto") {
            generationMode = topicData.pdfS3Key ? "pdf" : "text";
        }

        // Build combined crib from subject + topic
        const cribParts: string[] = [];
        if (typeof subjectContext === 'object' && subjectContext.crib) cribParts.push(`[Subject Crib] ${subjectContext.crib}`);
        if (topicData.aiGuide) cribParts.push(`[Topic Crib] ${topicData.aiGuide}`);
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
            existingQuestions,
        };

        if (generationMode === "pdf" && topicData.pdfS3Key && topicData.pdfPageStart && topicData.pdfPageEnd) {
            // PDF Mode (Only if start and end pages are explicitly defined)
            const result = await generateQuestionsWithGemini(topicData.pdfS3Key, {
                ...options,
                pageStart: topicData.pdfPageStart,
                pageEnd: topicData.pdfPageEnd,
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
        existingQuestions,
    }: {
        topicData: TopicData;
        subjectContext: string | { label: string; crib: string | null };
        language: string;
        counts: { easy: number; medium: number; hard: number };
        mode?: "text" | "pdf" | "auto";
        comment?: string;
        existingQuestions?: string[];
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
                    existingQuestions,
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
                    existingQuestions,
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
                    existingQuestions,
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
        topicId?: string | number;
        subjectId?: string | number;
        gradeLevel?: number;
        complexity?: "easy" | "medium" | "hard";
        language: string;
        modelName?: string;
        actionName?: string;
    }) {
        if (!generatedQuestions.length) return { savedQuestions: [], topicStatsUpdated: false };

        // Build combined crib for each saved question
        let combinedCrib: string | null = null;
        try {
            const cribParts: string[] = [];
            if (subjectId) {
                const subj = await db.query.providerSubjects.findFirst({ where: eq(providerSubjects.id, String(subjectId)) });
                if (subj?.aiGuide) cribParts.push(subj.aiGuide);
            }
            if (topicId) {
                const t = await db.query.providerSubjectTopics.findFirst({ where: eq(providerSubjectTopics.id, String(topicId)) });
                if (t?.aiGuide) cribParts.push(t.aiGuide);
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
            aiGuide: combinedCrib,
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
