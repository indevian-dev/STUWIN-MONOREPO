import { HomeworkRepository } from "./Homework.repository";
import { AiSessionRepository } from "../ai-session/AiSession.repository";
import {
    type HomeworkEntity,
    type ActivitySessionEntity,
} from "../activity/Activity.types";
import { type DbClient } from "@/lib/database";
import { BaseService } from "../base/Base.service";
import { AuthContext } from "@/lib/domain/base/Base.types";
import { Database } from "@/lib/database";
import { PromptFlowType } from "@/lib/domain/ai-prompt/Intelligence.types";
import { SystemPromptService } from "../ai-prompt/SystemPrompt.service";
import { SemanticMasteryService } from "../semantic-mastery/SemanticMastery.service";
import { providerQuestions as questionsTable, providerSubjects, providerSubjectTopics, studentHomeworks } from "@/lib/database/schema";
import { eq } from "drizzle-orm";

/**
 * HomeworkService - Manages homework submissions and their AI sessions
 */
export class HomeworkService extends BaseService {
    constructor(
        private readonly repository: HomeworkRepository,
        private readonly aiSessionRepo: AiSessionRepository,
        private readonly ctx: AuthContext,
        private readonly db: Database,
        private readonly systemPrompts: SystemPromptService,
        private readonly semanticMastery: SemanticMasteryService
    ) {
        super();
    }

    async submit(accountId: string, data: { title: string; workspaceId: string; topicId?: string; description?: string; textContent?: string; media?: unknown[] }): Promise<{ success: boolean; data?: HomeworkEntity; error?: string }> {
        try {
            return await this.db.transaction(async (tx) => {
                const homework = await this.repository.create({
                    studentAccountId: accountId,
                    title: data.title,
                    workspaceId: data.workspaceId,
                    topicId: data.topicId,
                    description: data.description,
                    textContent: data.textContent,
                    media: data.media || [],
                    status: "pending",
                }, tx as DbClient);

                if (data.textContent || data.description) {
                    this.semanticMastery.runUnifiedKnowledgePipeline({
                        studentAccountId: accountId,
                        workspaceId: data.workspaceId,
                        providerWorkspaceId: data.workspaceId,
                        topicId: data.topicId,
                        sourceType: 'homework_report',
                        sourceId: homework.id,
                        contentSummary: `${data.title}: ${data.description || ''} ${data.textContent || ''}`,
                        masterySignal: 0.5,
                    }).catch(err => this.handleError(err, "submitHomework.semanticMastery"));
                }

                return { success: true, data: homework };
            });
        } catch (error) {
            this.handleError(error, "submitHomework");
            return { success: false, error: "Failed to submit homework" };
        }
    }

    async list(accountId: string): Promise<{ success: boolean; data?: HomeworkEntity[]; error?: string }> {
        try {
            const homeworks = await this.repository.listByAccount(accountId);
            return { success: true, data: homeworks };
        } catch (error) {
            this.handleError(error, "listHomeworks");
            return { success: false, error: "Failed to list homeworks" };
        }
    }

    async getDetail(homeworkId: string): Promise<{ success: boolean; data?: HomeworkEntity; error?: string }> {
        try {
            const homework = await this.repository.findById(homeworkId);
            if (!homework) return { success: false, error: "Homework not found" };
            return { success: true, data: homework };
        } catch (error) {
            this.handleError(error, "getHomeworkDetail");
            return { success: false, error: "Failed to get homework detail" };
        }
    }

    async initiateAiSession(homeworkId: string): Promise<{ success: boolean; data?: ActivitySessionEntity; error?: string }> {
        try {
            const homework = await this.repository.findById(homeworkId);
            if (!homework) return { success: false, error: "Homework not found" };

            if (homework.aiSessionId) {
                const session = await this.aiSessionRepo.findById(homework.aiSessionId);
                return { success: true, data: session as unknown as ActivitySessionEntity | undefined };
            }

            const aiCrib = await this.getEffectiveCrib({
                homeworkId: homework.id,
                topicId: homework.topicId || undefined,
            });

            const systemPrompt = await this.systemPrompts.getEffectivePromptResult(PromptFlowType.HOMEWORK_EXPLANATION, {
                homeworkTitle: homework.title,
                description: homework.description,
                textContent: homework.textContent,
                aiCrib
            });

            const session = await this.aiSessionRepo.create({
                workspaceId: homework.workspaceId,
                studentAccountId: homework.studentAccountId,
                homeworkId: homework.id,
                rootQuestion: `Working on: ${homework.title}`,
                digests: {
                    nodes: [
                        { role: 'system', content: systemPrompt },
                        { role: 'assistant', content: `Hello! I see you're working on "${homework.title}". How can I help you get started or which part is challenging for you right now?` }
                    ]
                },
                status: 'active',
                branchCount: 1,
                messageCount: 1,
            });

            await this.repository.update(homework.id, { aiSessionId: session.id });

            return { success: true, data: session as unknown as ActivitySessionEntity };
        } catch (error) {
            this.handleError(error, "initiateHomeworkSession");
            return { success: false, error: "Failed to initiate session" };
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
