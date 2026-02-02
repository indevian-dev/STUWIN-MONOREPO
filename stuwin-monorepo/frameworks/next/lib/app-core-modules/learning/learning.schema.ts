
import { z } from "zod";

/**
 * Zod schemas for Learning module entities and API validation
 */

// ═══════════════════════════════════════════════════════════════
// SUBJECT SCHEMAS
// ═══════════════════════════════════════════════════════════════

export const subjectSchema = z.object({
    id: z.string().optional(),
    title: z.string().min(2).max(255),
    description: z.string().optional(),
    cover: z.string().url().optional().or(z.literal('')),
    slug: z.string().min(2).max(255),
    isActive: z.boolean().default(true),
    aiLabel: z.string().optional(),
});

export const createSubjectSchema = subjectSchema.omit({ id: true });
export const updateSubjectSchema = subjectSchema.partial();

// ═══════════════════════════════════════════════════════════════
// TOPIC SCHEMAS
// ═══════════════════════════════════════════════════════════════

export const topicSchema = z.object({
    id: z.string().optional(),
    providerSubjectId: z.string(),
    name: z.string().min(2).max(255),
    body: z.string(),
    gradeLevel: z.number().int().min(1).max(12).optional(),
    chapterNumber: z.string().optional(),
    subjectPdfId: z.number().optional(),
    isActiveForAi: z.boolean().default(false),
    pdfS3Key: z.string().optional(),
    pdfPageStart: z.number().int().optional(),
    pdfPageEnd: z.number().int().optional(),
});

export const createTopicSchema = topicSchema.omit({ id: true });
export const updateTopicSchema = topicSchema.partial();

// ═══════════════════════════════════════════════════════════════
// QUESTION SCHEMAS
// ═══════════════════════════════════════════════════════════════

export const questionSchema = z.object({
    id: z.string().optional(),
    question: z.string().min(5),
    answers: z.array(z.string()).min(2),
    correctAnswer: z.string(),
    providerSubjectId: z.string(),
    complexity: z.enum(['easy', 'medium', 'hard', 'expert']),
    gradeLevel: z.number().int().min(1).max(12),
    explanationGuide: z.object({
        correct: z.string(),
        incorrect: z.string(),
        hints: z.array(z.string()).optional(),
    }).optional(),
    language: z.string().default('azerbaijani'),
    isPublished: z.boolean().default(false),
});

export const createQuestionSchema = questionSchema.omit({ id: true });
export const updateQuestionSchema = questionSchema.partial();
