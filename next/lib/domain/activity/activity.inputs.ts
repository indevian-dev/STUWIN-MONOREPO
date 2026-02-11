
import { z } from "zod";
// Imports removed as they were unused

// ═══════════════════════════════════════════════════════════════
// ACTIVITY INPUT SCHEMAS
// ═══════════════════════════════════════════════════════════════

// ─── QUIZ ──────────────────────────────────────────────────────

export const QuizCreateSchema = z.object({
    studentAccountId: z.string(),
    providerSubjectId: z.string(),
    workspaceId: z.string(),
    questions: z.array(z.any()),
    userAnswers: z.array(z.object({
        questionId: z.string(),
        selectedAnswer: z.string(),
        timeSpent: z.number(),
    })).optional(),
    score: z.number().optional(),
    correctAnswers: z.number().optional(),
    totalQuestions: z.number(),
    status: z.enum(['in_progress', 'completed', 'abandoned']).default('in_progress'),
});

export type QuizCreateInput = z.infer<typeof QuizCreateSchema>;

// ─── HOMEWORK ──────────────────────────────────────────────────

export const HomeworkCreateSchema = z.object({
    studentAccountId: z.string(),
    workspaceId: z.string(),
    topicId: z.string().optional(),
    title: z.string().min(2),
    description: z.string().optional(),
    textContent: z.string().optional(),
    media: z.array(z.any()).default([]),
    status: z.enum(['pending', 'in_progress', 'completed', 'submitted']).default('pending'),
});

export type HomeworkCreateInput = z.infer<typeof HomeworkCreateSchema>;

// ─── QUIZ REPORT ───────────────────────────────────────────────

export const QuizReportSchema = z.object({
    quizId: z.string(),
    studentAccountId: z.string(),
    workspaceId: z.string(),
    reportText: z.string().optional(),
    learningInsights: z.object({
        strengths: z.array(z.string()),
        gaps: z.array(z.string()),
        recommendations: z.array(z.string()),
    }).optional(),
});

export type QuizReportInput = z.infer<typeof QuizReportSchema>;

// ─── AI SESSION ────────────────────────────────────────────────

export const AiSessionCreateSchema = z.object({
    studentAccountId: z.string(),
    workspaceId: z.string(),
    topicId: z.string().optional(),
    mode: z.string(),
    status: z.string(),
});

export type AiSessionCreateInput = z.infer<typeof AiSessionCreateSchema>;
