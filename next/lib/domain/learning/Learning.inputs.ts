import { z } from "zod";

import type { Subject } from '@stuwin/shared/types/domain/Subject.types';
import type { Topic } from '@stuwin/shared/types/domain/Topic.types';

// ═══════════════════════════════════════════════════════════════
// SUBJECT SCHEMAS
// Each schema `satisfies z.ZodType<T>` to enforce the shared contract.
// If the shared interface changes, TypeScript will error here.
// ═══════════════════════════════════════════════════════════════

export const SubjectCreateSchema = z.object({
    title: z.string().min(2).max(255),
    description: z.string().optional(),
    cover: z.string().url().optional().or(z.literal('')),
    slug: z.string().min(2).max(255),
    isActive: z.boolean().default(true).optional(),
    aiLabel: z.string().optional(),
    language: z.string().min(2).max(5).default('az').optional(),
    gradeLevel: z.number().int().min(1).max(20).default(1).optional(),
}) satisfies z.ZodType<Subject.Create>;

export type SubjectCreateInput = z.infer<typeof SubjectCreateSchema>;

export const SubjectUpdateSchema = SubjectCreateSchema.partial() satisfies z.ZodType<Subject.Update>;
export type SubjectUpdateInput = z.infer<typeof SubjectUpdateSchema>;

// ═══════════════════════════════════════════════════════════════
// TOPIC SCHEMAS
// ═══════════════════════════════════════════════════════════════

export const TopicCreateSchema = z.object({
    providerSubjectId: z.string().min(1),
    name: z.string().min(2).max(255),
    description: z.string().optional(),
    gradeLevel: z.number().int().min(1).max(12).optional(),
    isActiveAiGeneration: z.boolean().default(false).optional(),
    pdfDetails: z.object({
        fileName: z.string().optional(),
        pdfUrl: z.string().optional(),
        totalPages: z.number().int().optional(),
        chapterNumber: z.string().optional(),
        pages: z.object({
            start: z.number().optional(),
            end: z.number().optional(),
        }).optional(),
    }).optional(),
    questionsStats: z.object({
        total: z.number().int().optional(),
        remaining: z.number().int().optional(),
        capacity: z.number().int().optional(),
        published: z.number().int().optional(),
    }).optional(),

    language: z.string().optional(),
    aiGuide: z.string().optional(),
    aiSummary: z.string().optional(),
}) satisfies z.ZodType<Topic.Create>;

export type TopicCreateInput = z.infer<typeof TopicCreateSchema>;

export const TopicUpdateSchema = TopicCreateSchema.partial() satisfies z.ZodType<Topic.Update>;
export type TopicUpdateInput = z.infer<typeof TopicUpdateSchema>;

// ═══════════════════════════════════════════════════════════════
// QUESTION SCHEMAS
// ═══════════════════════════════════════════════════════════════

export const QuestionCreateSchema = z.object({
    question: z.string().min(5),
    answers: z.array(z.string()).min(2),
    correctAnswer: z.string(),
    providerSubjectId: z.string().min(1),
    providerSubjectTopicId: z.string().optional(),
    complexity: z.enum(['easy', 'medium', 'hard', 'expert']),
    gradeLevel: z.number().int().min(1).max(12),
    explanationGuide: z.union([
        z.object({
            correct: z.string(),
            incorrect: z.string(),
            hints: z.array(z.string()).optional(),
        }),
        z.object({
            content: z.string(),
        })
    ]).optional(),
    language: z.string().default('azerbaijani').optional(),
    workspaceId: z.string().optional(),
    aiGuide: z.string().optional(),
});

export type QuestionCreateInput = z.infer<typeof QuestionCreateSchema>;

export const QuestionUpdateSchema = QuestionCreateSchema.partial();
export type QuestionUpdateInput = z.infer<typeof QuestionUpdateSchema>;

// ═══════════════════════════════════════════════════════════════
// QUIZ SCHEMAS
// ═══════════════════════════════════════════════════════════════

export const QuizGenerateSchema = z.object({
    studentAccountId: z.string().min(1),
    subjectId: z.string().optional(),
    gradeLevel: z.number().optional(),
    language: z.string().optional(),
    complexity: z.enum(['easy', 'medium', 'hard', 'expert']).optional(),
    questionIds: z.array(z.string()).optional(),
});

export type QuizGenerateInput = z.infer<typeof QuizGenerateSchema>;
