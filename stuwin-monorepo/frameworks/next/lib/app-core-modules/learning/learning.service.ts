
import { LearningRepository } from "./learning.repository";
import { BaseService } from "../domain/BaseService";
import { AuthContext } from "@/lib/app-core-modules/types";
import { Database } from "@/lib/app-infrastructure/database";

/**
 * LearningService - Coordinates educational content delivery
 */
export class LearningService extends BaseService {
    constructor(
        private readonly repository: LearningRepository,
        private readonly ctx: AuthContext,
        private readonly db: Database
    ) {
        super();
    }

    /**
     * Get a full overview of a subject including topics
     */
    async getSubjectOverview(subjectId: string) {
        try {
            const subject = await this.repository.findSubjectById(subjectId);
            if (!subject) return { success: false, error: "Subject not found" };

            const topics = await this.repository.listTopicsBySubject(subjectId);
            const pdfs = await this.repository.listPdfsBySubject(subjectId);

            return {
                success: true,
                data: {
                    ...subject,
                    topics,
                    pdfs,
                },
            };
        } catch (error) {
            this.handleError(error, "getSubjectOverview");
            return { success: false, error: "Failed to load subject overview" };
        }
    }

    /**
     * Get all subjects for a specific workspace
     */
    async getWorkspaceSubjects(workspaceId: string) {
        try {
            const subjects = await this.repository.listSubjects({ workspaceId });
            return { success: true, data: subjects };
        } catch (error) {
            this.handleError(error, "getWorkspaceSubjects");
            return { success: false, error: "Failed to load subjects" };
        }
    }

    /**
     * Get all public subjects
     */
    async getPublicSubjects() {
        try {
            const subjects = await this.repository.listSubjects({ onlyActive: true });
            return { success: true, data: subjects };
        } catch (error) {
            this.handleError(error, "getPublicSubjects");
            return { success: false, error: "Failed to load subjects" };
        }
    }

    /**
     * Get all PDFs for a subject
     */
    async getSubjectPdfs(subjectId: string) {
        try {
            const pdfs = await this.repository.listPdfsBySubject(subjectId);
            return { success: true, data: pdfs };
        } catch (error) {
            this.handleError(error, "getSubjectPdfs");
            return { success: false, error: "Failed to load subject PDFs" };
        }
    }

    /**
     * Save metadata for an uploaded PDF
     */
    async saveSubjectPdf(params: {
        subjectId: string;
        pdfUrl: string;
        uploadAccountId: string;
        workspaceId: string;
        name?: string;
        language?: string;
    }) {
        try {
            const newPdf = await this.repository.createSubjectPdf({
                learningSubjectId: params.subjectId,
                pdfUrl: params.pdfUrl,
                uploadAccountId: params.uploadAccountId,
                workspaceId: params.workspaceId,
                name: params.name,
                language: params.language,
                isActive: true,
                createdAt: new Date(),
            });

            return { success: true, data: newPdf };
        } catch (error) {
            this.handleError(error, "saveSubjectPdf");
            return { success: false, error: "Failed to save PDF metadata" };
        }
    }

    /**
     * Create a new subject
     */
    async createSubject(data: any) {
        try {
            const newSubject = await this.repository.createSubject({
                ...data,
                createdAt: new Date(),
                isActive: true
            });

            return { success: true, data: newSubject };
        } catch (error) {
            this.handleError(error, "createSubject");
            return { success: false, error: "Failed to create subject" };
        }
    }

    /**
     * Update an existing subject
     */
    async updateSubject(id: string, data: any) {
        try {
            const updated = await this.repository.updateSubject(id, data);
            if (!updated) return { success: false, error: "Subject not found" };
            return { success: true, data: updated };
        } catch (error) {
            this.handleError(error, "updateSubject");
            return { success: false, error: "Failed to update subject" };
        }
    }

    /**
     * List questions with pagination and filters
     */
    async listQuestions(params: {
        page?: number;
        pageSize?: number;
        subjectId?: string;
        complexity?: string;
        gradeLevel?: number;
        authorAccountId?: string;
        onlyPublished?: boolean;
        workspaceId?: string;
    }) {
        try {
            const page = params.page || 1;
            const pageSize = params.pageSize || 20;
            const offset = (page - 1) * pageSize;

            const [questions, total] = await Promise.all([
                this.repository.listQuestions({
                    limit: pageSize,
                    offset,
                    learningSubjectId: params.subjectId,
                    complexity: params.complexity,
                    gradeLevel: params.gradeLevel,
                    authorAccountId: params.authorAccountId,
                    onlyPublished: params.onlyPublished,
                    workspaceId: params.workspaceId
                }),
                this.repository.countQuestions({
                    learningSubjectId: params.subjectId,
                    complexity: params.complexity,
                    gradeLevel: params.gradeLevel,
                    authorAccountId: params.authorAccountId,
                    onlyPublished: params.onlyPublished,
                    workspaceId: params.workspaceId
                })
            ]);

            return {
                success: true,
                data: {
                    questions,
                    pagination: {
                        page,
                        pageSize,
                        total,
                        totalPages: Math.ceil(total / pageSize)
                    }
                }
            };
        } catch (error) {
            this.handleError(error, "listQuestions");
            return { success: false, error: "Failed to list questions" };
        }
    }

    /**
     * Create a new question
     */
    async createQuestion(data: any, authorAccountId: string) {
        try {
            const newQuestion = await this.repository.createQuestion({
                ...data,
                authorAccountId,
                createdAt: new Date(),
                updatedAt: new Date(),
                isPublished: false
            });

            return { success: true, data: newQuestion };
        } catch (error) {
            this.handleError(error, "createQuestion");
            return { success: false, error: "Failed to create question" };
        }
    }

    /**
     * Create a topic and associate it with a PDF if provided
     */
    async createTopicWithContent(subjectId: string, data: { name: string; description: string; gradeLevel?: number; language?: string; pdfId?: string }) {
        try {
            return await this.db.transaction(async (tx) => {
                const topic = await this.repository.createTopic({
                    learningSubjectId: subjectId,
                    name: data.name,
                    description: data.description,
                    gradeLevel: data.gradeLevel,
                    language: data.language,
                    subjectPdfId: data.pdfId,
                    workspaceId: this.ctx.activeWorkspaceId || "default",
                    isActiveForAi: false
                }, tx as any);

                return { success: true, data: topic };
            });
        } catch (error) {
            this.handleError(error, "createTopicWithContent");
            return { success: false, error: "Failed to create topic" };
        }
    }

    /**
     * Get single question by ID
     */
    async getQuestionById(id: string) {
        try {
            const question = await this.repository.findQuestionById(id);
            if (!question) return { success: false, error: "Question not found" };
            return { success: true, data: question };
        } catch (error) {
            this.handleError(error, "getQuestionById");
            return { success: false, error: "Failed to get question" };
        }
    }

    /**
     * Update question
     */
    async updateQuestion(id: string, data: any) {
        try {
            const updated = await this.repository.updateQuestion(id, data);
            if (!updated) return { success: false, error: "Question not found or update failed" };
            return { success: true, data: updated };
        } catch (error) {
            this.handleError(error, "updateQuestion");
            return { success: false, error: "Failed to update question" };
        }
    }

    /**
     * Set question publish status
     */
    async setQuestionPublished(id: string, isPublished: boolean) {
        try {
            const updated = await this.repository.updateQuestion(id, { isPublished });
            if (!updated) return { success: false, error: "Question not found" };
            return { success: true, data: updated };
        } catch (error) {
            this.handleError(error, "setQuestionPublished");
            return { success: false, error: "Failed to update publish status" };
        }
    }

    /**
     * Delete question
     */
    async deleteQuestion(id: string) {
        try {
            const deleted = await this.repository.deleteQuestion(id);
            if (!deleted) return { success: false, error: "Question not found or delete failed" };
            return { success: true, data: deleted };
        } catch (error) {
            this.handleError(error, "deleteQuestion");
            return { success: false, error: "Failed to delete question" };
        }
    }

    /**
     * Map a database question record to legacy format
     */
    mapQuestionToLegacy(data: any) {
        const q = data.question || data;
        return {
            id: q.id,
            body: q.question,
            answers: q.answers,
            correct_answer: q.correctAnswer,
            subject_id: q.learningSubjectId,
            complexity: q.complexity,
            grade_level: q.gradeLevel,
            explanation_guide: q.explanationGuide,
            is_published: q.isPublished,
            created_at: q.createdAt,
            updated_at: q.updatedAt
        };
    }

    /**
     * Increment topic question stats
     */
    async incrementTopicQuestionStats(topicId: string, count: number) {
        try {
            await this.repository.incrementTopicQuestionStats(topicId, count);
            return { success: true };
        } catch (error) {
            this.handleError(error, "incrementTopicQuestionStats");
            return { success: false, error: "Failed to update topic stats" };
        }
    }

    /**
     * Update a topic
     */
    async updateTopic(topicId: string, data: any) {
        try {
            const updated = await this.repository.updateTopic(topicId, data);
            if (!updated) return { success: false, error: "Topic not found" };
            return { success: true, data: updated };
        } catch (error) {
            this.handleError(error, "updateTopic");
            return { success: false, error: "Failed to update topic" };
        }
    }

    /**
     * Get a single topic detail
     */
    async getTopicDetail(topicId: string, subjectId?: string) {
        try {
            const topic = await this.repository.findTopicById(topicId);
            if (!topic) return { success: false, error: "Topic not found" };

            if (subjectId && topic.learningSubjectId !== subjectId) {
                return { success: false, error: "Topic does not belong to this subject" };
            }

            return { success: true, data: topic };
        } catch (error) {
            this.handleError(error, "getTopicDetail");
            return { success: false, error: "Failed to load topic detail" };
        }
    }

    /**
     * Bulk create topics
     */
    async bulkCreateTopics(subjectId: string, topicsData: any[]) {
        try {
            const result = await this.db.transaction(async (tx) => {
                const topicsToInsert = topicsData.map(t => ({
                    learningSubjectId: subjectId,
                    name: t.name,
                    description: t.description || t.body,
                    gradeLevel: t.gradeLevel,
                    language: t.language,
                    chapterNumber: t.chapterNumber,
                    subjectPdfId: t.subjectPdfId,
                    workspaceId: this.ctx.activeWorkspaceId || "default",
                    isActiveForAi: t.isActiveForAi || false,
                    pdfS3Key: t.pdfS3Key,
                    pdfPageStart: t.pdfPageStart,
                    pdfPageEnd: t.pdfPageEnd
                }));

                const createdTopics = await this.repository.bulkCreateTopics(topicsToInsert, tx as any);

                const pdfId = topicsToInsert.find(t => t.subjectPdfId)?.subjectPdfId;
                if (pdfId) {
                    const pdf = await this.repository.getPdfById(pdfId, tx as any);
                    if (pdf) {
                        const currentOrder = (pdf.topicsOrderedIds as any) || [];
                        const newIds = createdTopics.map(t => t.id);
                        const updatedOrder = [...currentOrder, ...newIds];
                        await this.repository.updatePdfOrder(pdfId, updatedOrder, tx as any);
                    }
                }

                return createdTopics;
            });

            return { success: true, data: result };
        } catch (error) {
            this.handleError(error, "bulkCreateTopics");
            return { success: false, error: "Failed to create topics" };
        }
    }
}
