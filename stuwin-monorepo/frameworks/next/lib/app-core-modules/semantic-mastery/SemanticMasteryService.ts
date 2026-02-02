import { db } from "@/lib/app-infrastructure/database";
import {
    studentKnowledgeHubs,
    providerKnowledgeHubs,
    providerKnowledgeDeltas,
    workspaces,
    accounts
} from "@/lib/app-infrastructure/database/schema";
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
        const model = this.genAI.getGenerativeModel({ model: "text-embedding-004" });
        const result = await model.embedContent({
            content: { role: "user", parts: [{ text }] },
            taskType,
        });
        return result.embedding.values;
    }

    /**
     * Entry point after a student completes a quiz or homework.
     * 1. Generates a new vector layer.
     * 2. Synthesizes/Updates the Student's global DNA.
     * 3. Triggers Adaptive Sampling update for the Provider Hub.
     */
    async processActivityProgress(params: {
        studentAccountId: string;
        workspaceId: string;
        providerWorkspaceId: string;
        textContent: string; // The AI mini-report or activity summary
    }) {
        const { studentAccountId, workspaceId, providerWorkspaceId, textContent } = params;

        // 1. Generate new vector layer
        const newLayerVector = await this.generateEmbedding(textContent);

        // 2. Update Student Knowledge DNA (Recursive synthesis)
        await this.syncStudentDNA(studentAccountId, workspaceId, newLayerVector);

        // 3. Adaptive Update for Provider Hub (Zero-Maintenance Scaling)
        await this.adaptiveProviderUpdate(providerWorkspaceId, newLayerVector);
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
                knowledgeVector: sql`(${existing.knowledgeVector}::vector * 0.9) + (${newVector}::vector * 0.1)`,
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
                        sumVector: sql`(${providerKnowledgeHubs.sumVector}::vector + ${deltaVector}::vector)`,
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
}
