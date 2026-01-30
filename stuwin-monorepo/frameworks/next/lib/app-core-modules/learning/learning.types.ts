
import type { Timestamps } from '../../../types/base';

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
    }
}

// ═══════════════════════════════════════════════════════════════
// TOPICS
// ═══════════════════════════════════════════════════════════════

export namespace Topic {
    export interface Entity extends Timestamps {
        id: string;
        body: string;
        gradeLevel: number;
        name: string;
        subjectId: string;
        aiSummary?: string;
        isActiveForAi: boolean;
        pdfS3Key?: string;
        pdfPageStart?: number;
        pdfPageEnd?: number;
        chapterNumber?: string;
        parentTopicId?: string;
    }

    export interface CreateInput {
        body: string;
        gradeLevel: number;
        name: string;
        subjectId: string;
        aiSummary?: string;
        pdfS3Key?: string;
        pdfPageStart?: number;
        pdfPageEnd?: number;
        chapterNumber?: string;
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
        subjectId: string;
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
    }

    export interface CreateInput {
        question: string;
        answers: string[];
        correctAnswer: string;
        subjectId: string;
        complexity: QuestionComplexity;
        gradeLevel: number;
        explanationGuide: {
            correct: string;
            incorrect: string;
            hints?: string[];
        };
        language?: string;
        topicId: string;
    }
}

// ═══════════════════════════════════════════════════════════════
// QUIZZES
// ═══════════════════════════════════════════════════════════════

export type QuizStatus = 'in_progress' | 'completed' | 'abandoned';

export namespace Quiz {
    export interface StudentView extends Timestamps {
        id: string;
        studentAccountId: string;
        score?: number;
        questions?: string[];
        subjectId?: string;
        gradeLevel?: number;
        status?: QuizStatus;
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
