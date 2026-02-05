
import type { Timestamps } from '@/lib/app-core-modules/types';

// ═══════════════════════════════════════════════════════════════
// LEARNING MODULE TYPES
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// BRANDED IDs
// ═══════════════════════════════════════════════════════════════

export type SubjectId = string & { readonly __brand: 'SubjectId' };
export type TopicId = string & { readonly __brand: 'TopicId' };
export type QuestionId = string & { readonly __brand: 'QuestionId' };
export type QuizId = string & { readonly __brand: 'QuizId' };

// ═══════════════════════════════════════════════════════════════
// SUBJECTS
// ═══════════════════════════════════════════════════════════════

export namespace Subject {
    export interface PrivateAccess extends Timestamps {
        id: string;
        title: string;
        description?: string;
        cover?: string;
        slug: string;
        isActive: boolean;
        aiLabel?: string;
        totalQuestions: number;
        totalTopics: number;
        canManageTopics: boolean;
        aiAssistantCrib?: string;
        files?: any;
    }

    export interface StudentView extends Timestamps {
        id: string;
        title: string;
        description?: string;
        cover?: string;
        slug: string;
        isActive: boolean;
        totalQuestions: number;
        totalTopics: number;
        availableQuizzes: number;
        progress: {
            completedQuizzes: number;
            totalQuizzes: number;
            averageScore: number;
            timeSpent: number;
        };
    }

    export interface CreateInput {
        title: string;
        description?: string;
        cover?: string;
        slug: string;
        isActive?: boolean;
        aiLabel?: string;
        aiAssistantCrib?: string;
    }
}

// ═══════════════════════════════════════════════════════════════
// TOPICS
// ═══════════════════════════════════════════════════════════════

export interface TopicQuestionsStats {
    total?: number;
    remaining?: number;
    capacity?: number;
    published?: number;
}

export interface TopicPdfDetails {
    s3Key?: string;
    pdfUrl?: string; // For backward compatibility if needed
    pageStart?: number;
    pageEnd?: number;
    totalPages?: number;
    chapterNumber?: string;
    fileName?: string;
    pages?: { start?: number; end?: number }; // Seen in some UI components
}

export namespace Topic {
    export interface Entity extends Timestamps {
        id: string;
        description: string;
        gradeLevel: number;
        name: string;
        providerSubjectId: string;
        aiSummary?: string;
        isActiveAiGeneration: boolean;
        workspaceId: string;
        updatedAt: string;
        language?: string;
        aiAssistantCrib?: string;
        pdfDetails?: TopicPdfDetails;
        questionsStats?: TopicQuestionsStats;
        parentTopicId?: string;
    }

    export interface CreateInput {
        name: string;
        description?: string;
        gradeLevel?: number;
        providerSubjectId: string;
        aiSummary?: string;
        pdfDetails?: TopicPdfDetails;
        isActiveAiGeneration?: boolean;
        aiAssistantCrib?: string;
        questionsStats?: TopicQuestionsStats;
        parentTopicId?: string;
    }
}

// ═══════════════════════════════════════════════════════════════
// QUESTIONS
// ═══════════════════════════════════════════════════════════════

export type QuestionComplexity = 'easy' | 'medium' | 'hard' | 'expert';
export type QuestionStatus = 'draft' | 'pending_review' | 'approved' | 'rejected' | 'published';

export namespace Question {
    export interface PrivateAccess extends Timestamps {
        id: string;
        question: string;
        answers: string[];
        correctAnswer: string;
        providerSubjectId: string;
        complexity: QuestionComplexity;
        gradeLevel: number;
        explanationGuide: {
            correct: string;
            incorrect: string;
            hints: string[];
        };
        language: string;
        topicId: string;
        status: QuestionStatus;
        aiAssistantCrib?: string;
    }

    export interface CreateInput {
        question: string;
        answers: string[];
        correctAnswer: string;
        providerSubjectId: string;
        complexity: QuestionComplexity;
        gradeLevel: number;
        explanationGuide: {
            correct: string;
            incorrect: string;
            hints?: string[];
        };
        language?: string;
        topicId: string;
        aiAssistantCrib?: string;
    }
}

// ═══════════════════════════════════════════════════════════════
// QUIZZES
// ═══════════════════════════════════════════════════════════════

export type LearningQuizStatus = 'in_progress' | 'completed' | 'abandoned';

export namespace LearningQuiz {
    export interface StudentView extends Timestamps {
        id: string;
        studentAccountId: string;
        score?: number;
        questions?: string[];
        subjectId?: string;
        gradeLevel?: number;
        status?: LearningQuizStatus;
        startedAt?: string;
        completedAt?: string;
    }

    export interface CreateInput {
        studentAccountId: string;
        subjectId?: string;
        gradeLevel?: number;
        language?: string;
        complexity?: QuestionComplexity;
        questionIds?: string[];
    }
}
