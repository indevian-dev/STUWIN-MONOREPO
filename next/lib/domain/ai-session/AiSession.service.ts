import { AiSessionRepository } from "./AiSession.repository";
import {
    type DigestNode,
    type SessionDigests,
    type ActivitySessionEntity,
} from "../activity/Activity.types";
import { BaseService } from "../base/Base.service";
import { AuthContext } from "@/lib/domain/base/Base.types";
import { Database } from "@/lib/database";
import { genAI, GEMINI_MODELS } from "@/lib/integrations/google/Gemini.client";
import { providerQuestions as questionsTable, providerSubjects, providerSubjectTopics, studentAiSessions, studentHomeworks } from "@/lib/database/schema";
import { eq } from "drizzle-orm";
import { PromptFlowType } from "@/lib/domain/ai-prompt/Intelligence.types";
import { SystemPromptService } from "../ai-prompt/SystemPrompt.service";
import { SemanticMasteryService } from "../semantic-mastery/SemanticMastery.service";

/**
 * AiSessionService - Manages AI learning conversations and context analysis
 */
export class AiSessionService extends BaseService {
    constructor(
        private readonly repository: AiSessionRepository,
        private readonly ctx: AuthContext,
        private readonly db: Database,
        private readonly systemPrompts: SystemPromptService,
        private readonly semanticMastery: SemanticMasteryService,
    ) {
        super();
    }

    async addMessage(sessionId: string, userMessage: string) {
        try {
            const session = await this.repository.findById(sessionId);
            if (!session) return { success: false, error: "Session not found" };

            const digests = (session.digests as unknown as SessionDigests);
            const messages: DigestNode[] = digests?.nodes || [];

            const history = messages.map((m) => ({
                role: m.role === 'assistant' ? 'model' : (m.role || 'user'),
                parts: [{ text: m.content }]
            }));

            const model = genAI.getGenerativeModel({
                model: GEMINI_MODELS.FLASH_1_5,
                systemInstruction: messages.find((m) => m.role === 'system')?.content
            });

            const chat = model.startChat({
                history: history.filter((m) => m.role !== 'system'),
            });

            const result = await chat.sendMessage(userMessage);
            const aiResponse = result.response.text();

            const updatedMessages: DigestNode[] = [
                ...messages,
                { id: crypto.randomUUID(), type: 'chat', role: 'user', content: userMessage, createdAt: new Date().toISOString() },
                { id: crypto.randomUUID(), type: 'chat', role: 'assistant', content: aiResponse, createdAt: new Date().toISOString() }
            ];

            await this.repository.update(sessionId, {
                digests: { nodes: updatedMessages },
                messageCount: updatedMessages.length,
                totalTokensUsed: (session.totalTokensUsed || 0) + (result.response.usageMetadata?.totalTokenCount || 0)
            });

            return {
                success: true,
                data: {
                    answer: aiResponse,
                    sessionId
                }
            };
        } catch (error) {
            this.handleError(error, "addMessageToSession");
            return { success: false, error: "Failed to process chat message" };
        }
    }

    async get(accountId: string, contextId: string, contextType: 'quiz' | 'homework' | 'topic'): Promise<{ success: boolean; data?: ActivitySessionEntity | null; error?: string }> {
        try {
            const session = await this.repository.findActive(accountId, contextId, contextType);
            if (!session) return { success: true, data: null };
            return { success: true, data: session as unknown as ActivitySessionEntity };
        } catch (error) {
            this.handleError(error, "getSession");
            return { success: false, error: "Failed to get session" };
        }
    }

    async list(accountId: string, status: string = 'active') {
        try {
            const sessions = await this.repository.listByAccount(accountId, status);
            return { success: true, data: sessions };
        } catch (error) {
            this.handleError(error, "listSessions");
            return { success: false, error: "Failed to list sessions" };
        }
    }

    async getById(sessionId: string) {
        try {
            const session = await this.repository.findById(sessionId);
            if (!session) return { success: false, error: "Session not found" };
            return { success: true, data: session };
        } catch (error) {
            this.handleError(error, "getSessionById");
            return { success: false, error: "Failed to get session by ID" };
        }
    }

    async analyzeLearningContext(data: {
        workspaceId: string;
        accountId: string;
        contextType: 'quiz' | 'homework' | 'topic';
        contextId: string;
        question: string;
        correctAnswer: string;
        userAnswer: string;
        subjectTitle?: string;
        complexity?: string;
        selectedText?: string;
        digests?: DigestNode[];
        parentDigestId?: string;
        regenerateDigestId?: string;
        locale?: string;
    }): Promise<{ success: boolean; data?: { explanation: string; digest: DigestNode; session: ActivitySessionEntity }; error?: string }> {
        try {
            const {
                workspaceId, accountId, contextType, contextId,
                question, correctAnswer, userAnswer,
                subjectTitle, complexity, selectedText,
                digests = [] as DigestNode[], parentDigestId, regenerateDigestId, locale = 'en'
            } = data;

            let session = await this.repository.findActive(accountId, contextId, contextType);

            if (!session) {
                const sessionData: Partial<typeof studentAiSessions.$inferInsert> = {
                    workspaceId,
                    studentAccountId: accountId,
                    rootQuestion: question,
                    digests: { nodes: [] },
                    status: 'active',
                    branchCount: 0,
                    messageCount: 0,
                };

                if (contextType === 'quiz') sessionData.quizId = contextId;
                else if (contextType === 'homework') sessionData.homeworkId = contextId;
                else if (contextType === 'topic') sessionData.topicId = contextId;

                session = await this.repository.create(sessionData as typeof studentAiSessions.$inferInsert);
            }

            let context = `
Topic: ${subjectTitle || 'General Mathematics'}
Complexity: ${complexity || 'Standard'}
Question: ${question}
Correct Answer: ${correctAnswer}
Student's Answer: ${userAnswer}
CONTEXT: This is a ${contextType} session.
`;

            if (selectedText) {
                context += `\nSPECIFIC FOCUS: The student wants to understand this specific part better: "${selectedText}"\n`;
            }

            if (digests.length > 0) {
                const historyText = digests.map((d) => `Node [${d.id.slice(0, 4)}]: ${d.type.toUpperCase()} -> ${d.content}\nAI: ${d.aiResponse?.slice(0, 200)}...`).join('\n---\n');
                context += `\n\nPrevious Discovery Paths (Summary):\n${historyText}\n`;
            }

            const aiCrib = await this.getEffectiveCrib({
                questionId: contextId && contextType === 'topic' ? undefined : contextId,
                subjectId: session.topicId ? (await this.db.select({ sid: providerSubjectTopics.providerSubjectId }).from(providerSubjectTopics).where(eq(providerSubjectTopics.id, session.topicId)).limit(1))[0]?.sid || undefined : undefined,
                topicId: session.topicId || undefined,
            });

            let flowType = PromptFlowType.QUESTION_EXPLANATION;
            if (contextType === 'topic') flowType = PromptFlowType.TOPIC_EXPLORATION;

            const prompt = await this.systemPrompts.getEffectivePromptResult(flowType, {
                contextType,
                subjectTitle: subjectTitle || 'General Mathematics',
                complexity: complexity || 'Standard',
                question,
                correctAnswer,
                userAnswer,
                selectedText: selectedText || undefined,
                historyText: digests.length > 0 ? context : undefined,
                locale,
                aiCrib
            });

            const model = genAI.getGenerativeModel({ model: GEMINI_MODELS.FLASH_1_5 });
            const aiResult = await model.generateContent([{ text: prompt }]);
            const response = await aiResult.response.text();

            const newDigest = {
                id: regenerateDigestId || crypto.randomUUID(),
                parentId: parentDigestId || null,
                type: selectedText ? 'term' : 'analysis',
                content: selectedText || 'Full Analysis',
                aiResponse: response,
                createdAt: new Date().toISOString()
            };

            const sessionDigests = (session.digests as unknown as SessionDigests);
            let currentDigests: DigestNode[] = sessionDigests?.nodes || [];

            if (regenerateDigestId) {
                const toRemove = new Set<string>();
                const queue = [regenerateDigestId];

                while (queue.length > 0) {
                    const pid = queue.shift();
                    currentDigests.forEach((d) => {
                        if (d.parentId === pid) {
                            toRemove.add(d.id);
                            queue.push(d.id);
                        }
                    });
                }

                currentDigests = currentDigests.filter((d) => d.id !== regenerateDigestId && !toRemove.has(d.id));
            }

            const updatedDigests = [...currentDigests, newDigest];

            await this.repository.update(session.id, {
                digests: { nodes: updatedDigests },
                messageCount: (session.messageCount || 0) + 1,
                totalTokensUsed: (session.totalTokensUsed || 0) + (aiResult.response.usageMetadata?.totalTokenCount || 0)
            });

            // Fire-and-forget: Unified Knowledge Hub pipeline
            const resolvedSourceType = selectedText ? 'term_deepdive' :
                contextType === 'quiz' ? 'quiz_analysis' :
                    contextType === 'homework' ? 'homework_report' : 'topic_exploration';

            this.semanticMastery.runUnifiedKnowledgePipeline({
                studentAccountId: accountId,
                workspaceId,
                providerWorkspaceId: workspaceId,
                topicId: session.topicId || undefined,
                sourceType: resolvedSourceType,
                sourceId: contextId,
                contentSummary: response,
                masterySignal: selectedText ? 0.6 : 0.5,
            }).catch(err => console.error("[AiSessionService] Knowledge Hub pipeline error:", err));

            return {
                success: true,
                data: {
                    explanation: response,
                    digest: newDigest,
                    session: {
                        ...session,
                        digests: { nodes: updatedDigests }
                    }
                }
            };
        } catch (error) {
            this.handleError(error, "analyzeQuizQuestion");
            return { success: false, error: "Failed to analyze question" };
        }
    }

    private async getEffectiveCrib(params: {
        questionId?: string;
        topicId?: string;
        subjectId?: string;
        homeworkId?: string;
    }) {
        const cribs: string[] = [];

        if (params.questionId) {
            const q = await this.db.select({ crib: questionsTable.aiGuide }).from(questionsTable).where(eq(questionsTable.id, params.questionId)).limit(1);
            if (q[0]?.crib) cribs.push(q[0].crib);
        }

        if (params.homeworkId) {
            const h = await this.db.select({ crib: studentHomeworks.aiGuide }).from(studentHomeworks).where(eq(studentHomeworks.id, params.homeworkId)).limit(1);
            if (h[0]?.crib) cribs.push(h[0].crib);
        }

        let topicId = params.topicId;
        let subjectId = params.subjectId;

        if (params.questionId && !topicId) {
            const qData = await this.db.select({ tid: questionsTable.providerSubjectTopicId, sid: questionsTable.providerSubjectId }).from(questionsTable).where(eq(questionsTable.id, params.questionId)).limit(1);
            if (qData[0]) {
                topicId = qData[0].tid || undefined;
                subjectId = qData[0].sid || undefined;
            }
        }

        if (topicId) {
            const t = await this.db.select({ crib: providerSubjectTopics.aiGuide, sid: providerSubjectTopics.providerSubjectId }).from(providerSubjectTopics).where(eq(providerSubjectTopics.id, topicId)).limit(1);
            if (t[0]?.crib) cribs.push(t[0].crib);
            if (!subjectId) subjectId = t[0]?.sid || undefined;
        }

        if (subjectId) {
            const s = await this.db.select({ crib: providerSubjects.aiGuide }).from(providerSubjects).where(eq(providerSubjects.id, subjectId)).limit(1);
            if (s[0]?.crib) cribs.push(s[0].crib);
        }

        return cribs.length > 0 ? cribs.join("\n\n---\n\n") : undefined;
    }

}
