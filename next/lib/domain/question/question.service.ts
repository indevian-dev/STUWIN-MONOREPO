import { QuestionRepository } from "./question.repository";
import { SubjectRepository } from "../subject/subject.repository";
import { TopicRepository } from "../topic/topic.repository";
import { BaseService } from "../base/base.service";
import { AuthContext } from "@/lib/domain/base/types";
import { Database } from "@/lib/database";

import type { QuestionProviderView } from "../learning/learning.views";
import type { QuestionCreateInput } from "../learning/learning.inputs";

/**
 * QuestionService - Manages questions (CRUD, listing, publishing)
 */
export class QuestionService extends BaseService {
    constructor(
        private readonly repository: QuestionRepository,
        private readonly subjectRepository: SubjectRepository,
        private readonly topicRepository: TopicRepository,
        private readonly ctx: AuthContext,
        private readonly db: Database,
    ) {
        super();
    }

    async list(params: {
        page?: number; pageSize?: number; subjectId?: string; complexity?: string;
        gradeLevel?: number; authorAccountId?: string; onlyPublished?: boolean; workspaceId?: string;
    }) {
        try {
            const page = params.page || 1;
            const pageSize = params.pageSize || 20;
            const offset = (page - 1) * pageSize;
            const [questions, total] = await Promise.all([
                this.repository.list({ limit: pageSize, offset, providerSubjectId: params.subjectId, complexity: params.complexity, gradeLevel: params.gradeLevel, authorAccountId: params.authorAccountId, onlyPublished: params.onlyPublished, workspaceId: params.workspaceId }),
                this.repository.count({ providerSubjectId: params.subjectId, complexity: params.complexity, gradeLevel: params.gradeLevel, authorAccountId: params.authorAccountId, onlyPublished: params.onlyPublished, workspaceId: params.workspaceId })
            ]);
            return { success: true, data: { questions, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } } };
        } catch (error) {
            this.handleError(error, "list");
            return { success: false, error: "Failed to list questions" };
        }
    }

    async create(data: QuestionCreateInput, authorAccountId: string) {
        try {
            const newQuestion = await this.repository.create({ ...data, authorAccountId, createdAt: new Date(), updatedAt: new Date(), isPublished: false });
            return { success: true, data: newQuestion };
        } catch (error) {
            this.handleError(error, "create");
            return { success: false, error: "Failed to create question" };
        }
    }

    async getById(id: string) {
        try {
            const question = await this.repository.findById(id);
            if (!question) return { success: false, error: "Question not found" };
            return { success: true, data: question as unknown as QuestionProviderView };
        } catch (error) {
            this.handleError(error, "getById");
            return { success: false, error: "Failed to get question" };
        }
    }

    async update(id: string, data: Partial<QuestionCreateInput> & Record<string, unknown>) {
        try {
            const updated = await this.repository.update(id, data);
            if (!updated) return { success: false, error: "Question not found or update failed" };
            return { success: true, data: updated };
        } catch (error) {
            this.handleError(error, "update");
            return { success: false, error: "Failed to update question" };
        }
    }

    async setPublished(id: string, isPublished: boolean) {
        try {
            const updated = await this.repository.update(id, { isPublished });
            if (!updated) return { success: false, error: "Question not found" };
            return { success: true, data: updated };
        } catch (error) {
            this.handleError(error, "setPublished");
            return { success: false, error: "Failed to update publish status" };
        }
    }

    async delete(id: string) {
        try {
            const deleted = await this.repository.delete(id);
            if (!deleted) return { success: false, error: "Question not found or delete failed" };
            return { success: true, data: deleted };
        } catch (error) {
            this.handleError(error, "delete");
            return { success: false, error: "Failed to delete question" };
        }
    }

    mapToLegacy(data: QuestionProviderView) {
        const q = data;
        return {
            id: q.id, body: q.question, answers: q.answers, correct_answer: q.correctAnswer || "",
            complexity: q.complexity, grade_level: q.gradeLevel, explanation_guide: q.explanationGuide,
            is_published: q.isPublished, created_at: q.createdAt, updated_at: q.updatedAt
        };
    }

    async getBySubject(params: { slug: string; page?: number; pageSize?: number; complexity?: string; gradeLevel?: number; }) {
        try {
            const subject = await this.subjectRepository.findBySlug(params.slug);
            if (!subject) return { success: false, error: "Subject not found", code: 404 };
            const subjectWithTitle = { ...subject, title: subject.name };
            const page = params.page || 1;
            const pageSize = params.pageSize || 20;
            const result = await this.list({ page, pageSize, subjectId: subject.id, complexity: params.complexity, gradeLevel: params.gradeLevel, onlyPublished: true });
            if (!result.success || !result.data) return result;
            return { success: true, data: { subject: subjectWithTitle, questions: result.data.questions as unknown as QuestionProviderView[], totalPages: result.data.pagination.totalPages } };
        } catch (error) {
            this.handleError(error, "getBySubject");
            return { success: false, error: "Failed to load questions by subject" };
        }
    }
}
