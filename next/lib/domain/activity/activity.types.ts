
import { type InferSelectModel } from 'drizzle-orm';
import {
    studentQuizzes,
    studentHomeworks,
    studentAiSessions,
    type QuizPerformanceAnalytics // Exporting type from schema
} from "@/lib/database/schema";
import type { QuestionEntity } from '../learning';

export type { QuizPerformanceAnalytics, QuestionEntity };

// ═══════════════════════════════════════════════════════════════
// ACTIVITY MODULE TYPES
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// QUIZZES
// ═══════════════════════════════════════════════════════════════

export type QuizStatus = 'in_progress' | 'completed' | 'abandoned';

export interface UserAnswer {
    questionId: string;
    selectedAnswer: string;
    timeSpent: number;
}

export interface QuizAiReport {
    reportText: string;
    learningInsights: {
        strengths: string[];
        gaps: string[];
        recommendations: string[];
    };
}

export interface QuizResultDetail {
    question_id: string;
    question_body: string;
    user_answer: string | null;
    user_answer_letter?: string | null;
    correct_answer: string;
    is_correct?: boolean;
    time_spent?: number;
    complexity?: string;
    explanation?: string;
}

export interface QuizResult {
    score: number;
    correct_answers: number;
    total_questions: number;
    total_answered: number;
    unanswered: number;
    total_time_spent: number;
    average_time_per_question: number;
    completed_at: string;
    details: QuizResultDetail[];
}

export type QuizEntity = InferSelectModel<typeof studentQuizzes> & {
    snapshotQuestions?: QuestionEntity[] | string[];
    userAnswers?: UserAnswer[];
    result?: QuizResult;
};

// ═══════════════════════════════════════════════════════════════
// HOMEWORKS
// ═══════════════════════════════════════════════════════════════

export type HomeworkStatus = 'pending' | 'in_progress' | 'completed' | 'submitted';

export type HomeworkEntity = InferSelectModel<typeof studentHomeworks>;

// ═══════════════════════════════════════════════════════════════
// LEARNING SESSIONS
// ═══════════════════════════════════════════════════════════════

export interface DigestNode {
    id: string;
    parentId?: string | null;
    type: string;
    role?: string; // For compatibility with chat messages
    content: string;
    aiResponse?: string;
    createdAt: string;
}

export interface SessionDigests {
    nodes: DigestNode[];
}

export type ActivitySessionEntity = InferSelectModel<typeof studentAiSessions> & {
    digests: SessionDigests;
};
