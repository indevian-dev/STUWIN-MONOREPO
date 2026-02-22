
import { type InferSelectModel } from 'drizzle-orm';
import {
    providerSubjects,
    providerSubjectTopics,
    providerQuestions,
} from '@/lib/database/schema';

// ═══════════════════════════════════════════════════════════════
// DATABASE ENTITIES — Single source of truth, derived from Drizzle
// ═══════════════════════════════════════════════════════════════

export type SubjectEntity = InferSelectModel<typeof providerSubjects>;
export type TopicEntity = InferSelectModel<typeof providerSubjectTopics>;
export type QuestionEntity = InferSelectModel<typeof providerQuestions>;

// ═══════════════════════════════════════════════════════════════
// BRANDED IDs (for compile-time safety)
// ═══════════════════════════════════════════════════════════════

export type SubjectId = string & { readonly __brand: 'SubjectId' };
export type TopicId = string & { readonly __brand: 'TopicId' };
export type QuestionId = string & { readonly __brand: 'QuestionId' };
export type QuizId = string & { readonly __brand: 'QuizId' };

// ═══════════════════════════════════════════════════════════════
// JSONB COLUMN SHAPES (used by schema.ts and views)
// ═══════════════════════════════════════════════════════════════

export interface TopicPdfDetails {
    s3Key?: string;
    pdfUrl?: string;
    pageStart?: number;
    pageEnd?: number;
    totalPages?: number;
    chapterNumber?: string;
    fileName?: string;
    pages?: { start?: number; end?: number };
}

export interface TopicQuestionsStats {
    total?: number;
    remaining?: number;
    capacity?: number;
    published?: number;
}

export interface QuestionContextSnapshot {
    subjectName: string;
    topicName: string;
    chapterNumber?: string;
}

export type QuestionComplexity = 'easy' | 'medium' | 'hard' | 'expert';
export type QuestionStatus = 'draft' | 'pending_review' | 'approved' | 'rejected' | 'published';
