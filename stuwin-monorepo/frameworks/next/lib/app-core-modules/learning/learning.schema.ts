
import { z } from "zod";

/**
 * Zod schemas for Learning module entities and API validation
 */

// ═══════════════════════════════════════════════════════════════
// SUBJECT SCHEMAS
// ═══════════════════════════════════════════════════════════════

export const subjectSchema = z.object({
    id: z.string().optional(),
    title: z.string().min(2).max(255).refine((v) => {
        const locales = (process.env.ALLOWED_PROVIDER_CONTENTLOCALES || 'az').split(',');
        const regex = new RegExp(`-(${locales.join('|')})-(\\d+)$`);
        const match = v.match(regex);
        if (!match) return false;
        const grade = parseInt(match[2], 10);
        return grade >= 1 && grade <= 20;
    }, { message: "Subject title must end with -(locale)-(grade) (e.g. -az-1). Grade 1-20." }),
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
    description: z.string().optional(),
    gradeLevel: z.number().int().min(1).max(12).optional(),
    isActiveAiGeneration: z.boolean().default(false),
    pdfDetails: z.object({
        s3Key: z.string().optional(),
        pageStart: z.number().int().optional(),
        pageEnd: z.number().int().optional(),
        totalPages: z.number().int().optional(),
        chapterNumber: z.string().optional(),
        fileName: z.string().optional(),
        pages: z.object({
            start: z.number().optional(),
            end: z.number().optional()
        }).optional(),
    }).optional(),
    questionsStats: z.object({
        total: z.number().int().optional(),
        remaining: z.number().int().optional(),
        capacity: z.number().int().optional(),
        published: z.number().int().optional(),
    }).optional(),
    parentTopicId: z.string().optional(),
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
