import { db } from "@/lib/database";
import {
    studentKnowledgeHubs,
    providerKnowledgeHubs,
    providerSubjectTopics,
    studentKnowledgeHubEntries,
    providerKnowledgeHubEntries,
    studentTopicMastery
} from "@/lib/database/schema";
import { eq, sql, and } from "drizzle-orm";
import { GoogleGenerativeAI, TaskType } from "@google/generative-ai";

/**
 * SemanticMasteryService: The "Brain" of Stuwin's Progress Hub.
 * Handles Vector DNA synthesis, high-scale sampling, and semantic projection.
 */
export class SemanticMasteryService {
    private genAI: GoogleGenerativeAI;

    constructor() {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY is not defined in environment variables.");
        }
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }

    /**
     * Converts text (topics, reports, titles) into a 768-D vector.
     */
    async generateEmbedding(text: string, taskType: TaskType = TaskType.SEMANTIC_SIMILARITY): Promise<number[]> {
        const model = this.genAI.getGenerativeModel({ model: "gemini-embedding-001" });
        const result = await model.embedContent({
            content: { role: "user", parts: [{ text }] },
            taskType,
        });
        return result.embedding.values;
    }

    /**
     * Helper to format number array into pgvector string format "[x,y,z]"
     */
    private formatVector(v: number[]): string {
        return `[${v.join(",")}]`;
    }

    /**
     * UNIFIED KNOWLEDGE HUB PIPELINE:
     * 1. Embeds the content text exactly once.
     * 2. Writes the granular student interaction log.
     * 3. Calculates splash radius and updates mastery scores.
     * 4. Synthesizes/Updates the Student's global DNA hub.
     * 5. Writes granular provider interaction log.
     * 6. Triggers Adaptive Sampling update for the Provider global Hub.
     */
    async runUnifiedKnowledgePipeline(params: {
        studentAccountId: string;
        workspaceId: string;
        providerWorkspaceId?: string;
        providerSubjectId?: string;
        topicId?: string;
        sourceType: 'quiz_analysis' | 'term_deepdive' | 'homework_report' | 'topic_exploration';
        sourceId?: string;
        contentSummary: string;
        masterySignal?: number;
        metadata?: Record<string, unknown>;
    }) {
        try {
            // Auto-resolve missing hierarchy from topicId if applicable
            let finalSubjectId = params.providerSubjectId;
            let finalProviderWorkspaceId = params.providerWorkspaceId;

            if (params.topicId && (!finalSubjectId || !finalProviderWorkspaceId)) {
                const topicData = await db.select({
                    sid: providerSubjectTopics.providerSubjectId,
                    wid: providerSubjectTopics.workspaceId,
                }).from(providerSubjectTopics).where(eq(providerSubjectTopics.id, params.topicId)).limit(1);
                if (topicData[0]) {
                    finalSubjectId = finalSubjectId || topicData[0].sid || undefined;
                    finalProviderWorkspaceId = finalProviderWorkspaceId || topicData[0].wid || undefined;
                }
            }

            // 1. Generate one embedding efficiently
            const contentVector = await this.generateEmbedding(params.contentSummary);

            // 2. Write Granular Log (Student)
            await this.writeKnowledgeEntry({
                ...params,
                providerSubjectId: finalSubjectId,
                contentVector
            });

            // 3. Semantic Splash -> Update Mastery (if part of a subject)
            if (finalSubjectId) {
                const splashResults = await this.computeSemanticSplash(contentVector, finalSubjectId);
                if (splashResults.length > 0) {
                    await this.batchUpdateMastery(
                        params.studentAccountId,
                        params.workspaceId,
                        splashResults,
                        params.masterySignal || 0.5,
                        finalSubjectId
                    );
                }
            }

            // 4. Update Global Student DNA
            await this.syncStudentDNA(params.studentAccountId, params.workspaceId, contentVector);

            // 5. & 6. Provider Syncs
            if (finalProviderWorkspaceId) {
                await this.writeProviderEntry({
                    providerWorkspaceId: finalProviderWorkspaceId,
                    providerSubjectId: finalSubjectId,
                    topicId: params.topicId,
                    sourceType: params.sourceType,
                    contentVector,
                    masterySignal: params.masterySignal,
                });

                await this.adaptiveProviderUpdate(finalProviderWorkspaceId, contentVector);
            }
        } catch (error) {
            console.error("[SemanticMastery Service] Unified Pipeline failed:", error);
        }
    }

    /**
     * Weighted synthesis of student knowledge.
     * New DNA = (Old DNA * 0.9) + (New Layer * 0.1)
     */
    private async syncStudentDNA(studentAccountId: string, workspaceId: string, newVector: number[]) {
        const existing = await db.query.studentKnowledgeHubs.findFirst({
            where: and(
                eq(studentKnowledgeHubs.studentAccountId, studentAccountId),
                eq(studentKnowledgeHubs.workspaceId, workspaceId)
            )
        });

        if (!existing || !existing.knowledgeVector) {
            // First time: Initialize DNA
            await db.insert(studentKnowledgeHubs).values({
                studentAccountId,
                workspaceId,
                knowledgeVector: newVector,
            }).onConflictDoUpdate({
                target: [studentKnowledgeHubs.studentAccountId, studentKnowledgeHubs.workspaceId],
                set: { knowledgeVector: newVector, updatedAt: new Date() }
            });
            return;
        }

        // Weighted Average Update
        // Formula: New = (Old * 0.9) + (New * 0.1)
        await db.update(studentKnowledgeHubs)
            .set({
                knowledgeVector: sql`(${this.formatVector(existing.knowledgeVector as number[])}::vector * 0.9) + (${this.formatVector(newVector)}::vector * 0.1)`,
                updatedAt: new Date()
            })
            .where(eq(studentKnowledgeHubs.id, existing.id));
    }

    /**
     * Adaptive Dynamic Sampling: Throttles writes based on student count.
     * Small classes = 100% updates.
     * Massive classes = 0.1% updates.
     */
    private async adaptiveProviderUpdate(providerWorkspaceId: string, deltaVector: number[]) {
        // 1. Get current scale (student count)
        const hub = await db.query.providerKnowledgeHubs.findFirst({
            where: eq(providerKnowledgeHubs.id, providerWorkspaceId)
        });

        // Current count or fallback (default to small class behavior)
        const scale = hub?.studentCount || 10;

        // Sampling Formula: 100 / scale (capped at 1.0, min 0.001)
        const probability = Math.max(0.001, Math.min(1.0, 100 / scale));

        if (Math.random() <= probability) {
            // Perform Hub Update (Accumulate Sum)
            await db.insert(providerKnowledgeHubs)
                .values({
                    id: providerWorkspaceId,
                    sumVector: deltaVector,
                    studentCount: 1
                })
                .onConflictDoUpdate({
                    target: [providerKnowledgeHubs.id],
                    set: {
                        sumVector: sql`(${providerKnowledgeHubs.sumVector}::vector + ${this.formatVector(deltaVector)}::vector)`,
                        studentCount: sql`${providerKnowledgeHubs.studentCount} + 1`,
                        updatedAt: new Date()
                    }
                });
        }
    }

    /**
     * Generates a vector for a topic based on its name and description.
     */
    async generateTopicVector(name: string, description?: string): Promise<number[]> {
        const text = `${name}${description ? `: ${description}` : ""}`;
        return await this.generateEmbedding(text);
    }

    /**
     * Generates AND saves a topic vector to the database.
     */
    async generateAndSaveTopicVector(topicId: string, name: string, description?: string): Promise<number[]> {
        const vector = await this.generateTopicVector(name, description);
        await db.update(providerSubjectTopics)
            .set({ topicVector: vector })
            .where(eq(providerSubjectTopics.id, topicId));
        return vector;
    }

    /**
     * Returns the "Classroom Centroid" derived from the Provider Hub.
     */
    async getProviderCentroid(providerWorkspaceId: string): Promise<number[] | null> {
        const hub = await db.query.providerKnowledgeHubs.findFirst({
            where: eq(providerKnowledgeHubs.id, providerWorkspaceId)
        });

        if (!hub || !hub.sumVector || !hub.studentCount) return null;

        // Centroid = Sum / Count
        const centroid = hub.sumVector.map((v: number) => v / hub.studentCount!);
        return centroid;
    }

    // ═══════════════════════════════════════════════════════════════
    // KNOWLEDGE HUB PIPELINE
    // ═══════════════════════════════════════════════════════════════

    /**
     * Cosine similarity between two vectors.
     * Returns a value between -1 and 1 (1 = identical direction).
     */
    cosineSimilarity(a: number[], b: number[]): number {
        if (a.length !== b.length) return 0;
        let dot = 0, normA = 0, normB = 0;
        for (let i = 0; i < a.length; i++) {
            dot += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        const denom = Math.sqrt(normA) * Math.sqrt(normB);
        return denom === 0 ? 0 : dot / denom;
    }

    /**
     * Writes a knowledge entry for a student interaction.
     * Embeds the content and stores both text + vector.
     */
    async writeKnowledgeEntry(params: {
        studentAccountId: string;
        workspaceId: string;
        providerSubjectId?: string;
        topicId?: string;
        sourceType: 'quiz_analysis' | 'term_deepdive' | 'homework_report' | 'topic_exploration';
        sourceId?: string;
        contentSummary: string;
        contentVector?: number[];
        masterySignal?: number;
        metadata?: Record<string, unknown>;
    }) {
        const vector = params.contentVector || await this.generateEmbedding(params.contentSummary);

        await db.insert(studentKnowledgeHubEntries).values({
            studentAccountId: params.studentAccountId,
            workspaceId: params.workspaceId,
            providerSubjectId: params.providerSubjectId || null,
            topicId: params.topicId || null,
            sourceType: params.sourceType,
            sourceId: params.sourceId || null,
            contentSummary: params.contentSummary,
            contentVector: vector,
            masterySignal: params.masterySignal ?? null,
            metadata: params.metadata || {},
        });

        return vector;
    }

    /**
     * Writes/updates a provider-side aggregate entry.
     * Uses adaptive running average for the aggregated vector.
     */
    async writeProviderEntry(params: {
        providerWorkspaceId: string;
        providerSubjectId?: string;
        topicId?: string;
        sourceType: string;
        contentVector: number[];
        masterySignal?: number;
    }) {
        try {
            const existing = await db.select()
                .from(providerKnowledgeHubEntries)
                .where(and(
                    eq(providerKnowledgeHubEntries.providerWorkspaceId, params.providerWorkspaceId),
                    eq(providerKnowledgeHubEntries.topicId, params.topicId || ''),
                    eq(providerKnowledgeHubEntries.sourceType, params.sourceType),
                ))
                .limit(1);

            if (existing.length > 0) {
                const entry = existing[0];
                const count = (entry.studentCount || 0) + 1;
                const avgSignal = entry.averageMasterySignal
                    ? ((entry.averageMasterySignal * (count - 1)) + (params.masterySignal || 0.5)) / count
                    : params.masterySignal || 0.5;

                await db.update(providerKnowledgeHubEntries)
                    .set({
                        aggregatedVector: sql`(${this.formatVector(entry.aggregatedVector as number[])}::vector * ${(count - 1) / count}) + (${this.formatVector(params.contentVector)}::vector * ${1 / count})`,
                        studentCount: count,
                        averageMasterySignal: avgSignal,
                        updatedAt: new Date(),
                    })
                    .where(eq(providerKnowledgeHubEntries.id, entry.id));
            } else {
                await db.insert(providerKnowledgeHubEntries).values({
                    providerWorkspaceId: params.providerWorkspaceId,
                    providerSubjectId: params.providerSubjectId || null,
                    topicId: params.topicId || null,
                    sourceType: params.sourceType,
                    aggregatedVector: params.contentVector,
                    studentCount: 1,
                    averageMasterySignal: params.masterySignal || 0.5,
                });
            }
        } catch (err: unknown) {
            console.error("[SemanticMastery] Error writing provider entry:", err);
        }
    }

    /**
     * Semantic Splash: Compares a content vector against all topic vectors in a subject.
     * Returns topics above the similarity threshold, sorted by relevance.
     */
    async computeSemanticSplash(
        contentVector: number[],
        subjectId: string,
        threshold = 0.65
    ): Promise<{ topicId: string; similarity: number }[]> {
        const topics = await db.select({
            id: providerSubjectTopics.id,
            topicVector: providerSubjectTopics.topicVector,
        }).from(providerSubjectTopics)
            .where(eq(providerSubjectTopics.providerSubjectId, subjectId));

        return topics
            .filter(t => t.topicVector && Array.isArray(t.topicVector))
            .map(t => ({
                topicId: t.id,
                similarity: this.cosineSimilarity(contentVector, t.topicVector as number[]),
            }))
            .filter(t => t.similarity >= threshold)
            .sort((a, b) => b.similarity - a.similarity);
    }

    /**
     * Batch update mastery for all splashed topics.
     * Increment if masterySignal > 0.5 (student understood), decrement if < 0.5 (errors).
     * Score is clamped to 0–100.
     */
    async batchUpdateMastery(
        studentAccountId: string,
        workspaceId: string,
        splashResults: { topicId: string; similarity: number }[],
        masterySignal: number,
        subjectId?: string
    ) {
        for (const { topicId, similarity } of splashResults) {
            const delta = masterySignal > 0.5
                ? +(5 * similarity)   // increment: +5 * similarity (max +5 per splash)
                : -(3 * similarity);  // decrement: -3 * similarity (max -3 per splash)

            const existing = await db.select()
                .from(studentTopicMastery)
                .where(and(
                    eq(studentTopicMastery.studentAccountId, studentAccountId),
                    eq(studentTopicMastery.topicId, topicId),
                ))
                .limit(1);

            if (existing.length > 0) {
                const current = existing[0].masteryScore || 0;
                const newScore = Math.max(0, Math.min(100, current + delta));
                const trend = ((existing[0].masteryTrend as { score: number; date: string }[]) || []).slice(-9);
                trend.push({ score: newScore, date: new Date().toISOString() });

                await db.update(studentTopicMastery)
                    .set({
                        masteryScore: newScore,
                        lastAttemptAt: new Date(),
                        masteryTrend: trend,
                        updatedAt: new Date(),
                    })
                    .where(eq(studentTopicMastery.id, existing[0].id));
            } else {
                const initialScore = Math.max(0, Math.min(100, 50 + delta));
                await db.insert(studentTopicMastery).values({
                    studentAccountId,
                    workspaceId,
                    topicId,
                    providerSubjectId: subjectId || null,
                    masteryScore: initialScore,
                    totalQuizzesTaken: 1,
                    questionsAttempted: 1,
                    questionsCorrect: masterySignal > 0.5 ? 1 : 0,
                    lastAttemptAt: new Date(),
                    masteryTrend: [{ score: initialScore, date: new Date().toISOString() }],
                });
            }
        }
    }
}
