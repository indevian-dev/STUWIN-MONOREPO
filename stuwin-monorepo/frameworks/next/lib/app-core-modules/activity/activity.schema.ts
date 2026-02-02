
import { z } from "zod";

/**
 * Zod schemas for Activity module (Quizzes, Homeworks, Sessions)
 */

export const quizStatusSchema = z.enum(['in_progress', 'completed', 'abandoned']);

export const quizSchema = z.object({
    id: z.string().optional(),
    studentAccountId: z.string(),
    providerSubjectId: z.string(),
    workspaceId: z.string(),
    questions: z.array(z.any()),
    userAnswers: z.array(z.any()).optional(),
    score: z.number().optional(),
    correctAnswers: z.number().optional(),
    totalQuestions: z.number(),
    status: quizStatusSchema.default('in_progress'),
});

export const homeworkStatusSchema = z.enum(['pending', 'in_progress', 'completed', 'submitted']);

export const homeworkSchema = z.object({
    id: z.string().optional(),
    studentAccountId: z.string(),
    workspaceId: z.string(),
    topicId: z.string().optional(),
    title: z.string().min(2),
    description: z.string().optional(),
    textContent: z.string().optional(),
    media: z.array(z.any()).default([]),
    status: homeworkStatusSchema.default('pending'),
});

export const quizReportSchema = z.object({
    id: z.string().optional(),
    quizId: z.string(),
    studentAccountId: z.string(),
    workspaceId: z.string(),
    reportText: z.string().optional(),
    learningInsights: z.any().optional(),
});

export const aiSessionSchema = z.object({
    id: z.string().optional(),
    studentAccountId: z.string(),
    workspaceId: z.string(),
    topicId: z.string().optional(),
    mode: z.string(),
    status: z.string(),
});
