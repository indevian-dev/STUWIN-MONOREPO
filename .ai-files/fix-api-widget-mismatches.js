const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

function readFile(filePath) {
    return fs.readFileSync(filePath, 'utf8');
}

function writeFile(filePath, content) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Updated: ${path.relative(ROOT, filePath)}`);
}

// ─────────────────────────────────────────────────────────────────
// Fix 1: SubjectPdf interface in ProviderSubjectDetailWidget.tsx
// Remove pdfOrder, subjectId, uploadAccountId — add updatedAt
// ─────────────────────────────────────────────────────────────────
{
    const filePath = path.join(ROOT, 'next/app/[locale]/workspaces/provider/[workspaceId]/subjects/(widgets)/ProviderSubjectDetailWidget.tsx');
    let content = readFile(filePath);

    const oldInterface = `export interface SubjectPdf {
  id: string;
  pdfUrl: string;
  pdfOrder: string | null;
  subjectId: string;
  isActive: boolean;
  uploadAccountId: string | null;
  createdAt: string;
  name: string | null;
  language: string | null;
}`;

    const newInterface = `export interface SubjectPdf {
  id: string;
  pdfUrl: string;
  name: string | null;
  language: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string | null;
}`;

    if (content.includes('pdfOrder')) {
        content = content.replace(oldInterface, newInterface);
        writeFile(filePath, content);
    } else {
        console.log('⚠️  Fix 1: SubjectPdf already updated or pattern not found');
    }
}

// ─────────────────────────────────────────────────────────────────
// Fix 2: PDF option label in ProviderPdfTopicExtractorWidget.tsx
// Change: PDF #{pdf.id} - {pdf.pdfOrder || 'No order'}
// To:     {pdf.name || pdf.pdfUrl}
// ─────────────────────────────────────────────────────────────────
{
    const filePath = path.join(ROOT, 'next/app/[locale]/workspaces/provider/[workspaceId]/subjects/(widgets)/ProviderPdfTopicExtractorWidget.tsx');
    let content = readFile(filePath);

    const oldLabel = `PDF #{pdf.id} - {pdf.pdfOrder || 'No order'}`;
    const newLabel = `{pdf.name || pdf.pdfUrl}`;

    if (content.includes(oldLabel)) {
        content = content.replace(oldLabel, newLabel);
        writeFile(filePath, content);
    } else {
        console.log('⚠️  Fix 2: PDF label already updated or pattern not found');
    }
}

// ─────────────────────────────────────────────────────────────────
// Fix 3: ProviderQuestionListItemWidget.tsx
// Change: question.subjectId → question.providerSubjectId
// ─────────────────────────────────────────────────────────────────
{
    const filePath = path.join(ROOT, 'next/app/[locale]/workspaces/provider/[workspaceId]/subjects/(widgets)/ProviderQuestionListItemWidget.tsx');
    let content = readFile(filePath);

    const oldRef = 'subjectId={question.subjectId}';
    const newRef = 'subjectId={question.providerSubjectId}';

    if (content.includes(oldRef)) {
        content = content.replace(oldRef, newRef);
        writeFile(filePath, content);
    } else {
        console.log('⚠️  Fix 3: question.subjectId already updated or pattern not found');
    }
}

// ─────────────────────────────────────────────────────────────────
// Fix 4: Topics API route — replace getOverview with topic.list
// ─────────────────────────────────────────────────────────────────
{
    const filePath = path.join(ROOT, 'next/app/api/workspaces/provider/[workspaceId]/subjects/[id]/topics/route.ts');
    const newContent = `
import { unifiedApiHandler } from "@/lib/middleware/handlers";
import { okResponse, errorResponse } from '@/lib/middleware/responses/ApiResponse';

export const GET = unifiedApiHandler(async (request, { module, params }) => {
  const { id } = await params;
  if (!id) {
    return errorResponse("Invalid Subject ID", 400);
  }

  const result = await module.topic.list({ subjectId: id });

  if (!result.success) {
    return errorResponse(result.error || "Failed to fetch topics", 500);
  }

  return okResponse(result.data);
});
`;
    writeFile(filePath, newContent);
}

// ─────────────────────────────────────────────────────────────────
// Fix 5: question.repository.ts — add JOIN for subjectTitle/topicTitle
// ─────────────────────────────────────────────────────────────────
{
    const filePath = path.join(ROOT, 'next/lib/domain/question/question.repository.ts');
    const newContent = `
import { eq, count, and, sql } from "drizzle-orm";
import { providerQuestions, providerSubjects, providerSubjectTopics } from "@/lib/database/schema";
import { BaseRepository } from "../base/base.repository";
import { type DbClient } from "@/lib/database";

/**
 * QuestionRepository - Database operations for Question entities
 */
export class QuestionRepository extends BaseRepository {

    async findById(id: string, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client.select().from(providerQuestions).where(eq(providerQuestions.id, id)).limit(1);
        return result[0] || null;
    }

    async list(params: {
        limit: number; offset: number; providerSubjectId?: string; complexity?: string;
        gradeLevel?: number; authorAccountId?: string; onlyPublished?: boolean; workspaceId?: string;
    }, tx?: DbClient) {
        const client = tx ?? this.db;
        const filters = [];
        if (params.providerSubjectId) filters.push(eq(providerQuestions.providerSubjectId, params.providerSubjectId));
        if (params.complexity) filters.push(eq(providerQuestions.complexity, params.complexity));
        if (params.gradeLevel) filters.push(eq(providerQuestions.gradeLevel, params.gradeLevel));
        if (params.authorAccountId) filters.push(eq(providerQuestions.authorAccountId, params.authorAccountId));
        if (params.workspaceId) filters.push(eq(providerQuestions.workspaceId, params.workspaceId));
        if (params.onlyPublished) filters.push(eq(providerQuestions.isPublished, true));

        const rows = await client
            .select({
                id: providerQuestions.id,
                createdAt: providerQuestions.createdAt,
                updatedAt: providerQuestions.updatedAt,
                question: providerQuestions.question,
                answers: providerQuestions.answers,
                correctAnswer: providerQuestions.correctAnswer,
                authorAccountId: providerQuestions.authorAccountId,
                providerSubjectId: providerQuestions.providerSubjectId,
                providerSubjectTopicId: providerQuestions.providerSubjectTopicId,
                complexity: providerQuestions.complexity,
                gradeLevel: providerQuestions.gradeLevel,
                explanationGuide: providerQuestions.explanationGuide,
                language: providerQuestions.language,
                workspaceId: providerQuestions.workspaceId,
                isPublished: providerQuestions.isPublished,
                aiGuide: providerQuestions.aiGuide,
                visualData: providerQuestions.visualData,
                subjectTitle: providerSubjects.name,
                topicTitle: providerSubjectTopics.name,
            })
            .from(providerQuestions)
            .leftJoin(providerSubjects, eq(providerQuestions.providerSubjectId, providerSubjects.id))
            .leftJoin(providerSubjectTopics, eq(providerQuestions.providerSubjectTopicId, providerSubjectTopics.id))
            .where(filters.length > 0 ? and(...filters) : undefined)
            .limit(params.limit)
            .offset(params.offset);

        return rows;
    }

    async count(params: {
        providerSubjectId?: string; complexity?: string; gradeLevel?: number;
        authorAccountId?: string; onlyPublished?: boolean; workspaceId?: string;
    }, tx?: DbClient) {
        const client = tx ?? this.db;
        const filters = [];
        if (params.providerSubjectId) filters.push(eq(providerQuestions.providerSubjectId, params.providerSubjectId));
        if (params.complexity) filters.push(eq(providerQuestions.complexity, params.complexity));
        if (params.gradeLevel) filters.push(eq(providerQuestions.gradeLevel, params.gradeLevel));
        if (params.authorAccountId) filters.push(eq(providerQuestions.authorAccountId, params.authorAccountId));
        if (params.workspaceId) filters.push(eq(providerQuestions.workspaceId, params.workspaceId));
        if (params.onlyPublished) filters.push(eq(providerQuestions.isPublished, true));
        const result = await client.select({ count: count() }).from(providerQuestions).where(filters.length > 0 ? and(...filters) : undefined);
        return result[0].count;
    }

    async create(data: typeof providerQuestions.$inferInsert, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client.insert(providerQuestions).values(data).returning();
        return result[0];
    }

    async update(id: string, data: Partial<typeof providerQuestions.$inferInsert>, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client.update(providerQuestions).set(data).where(eq(providerQuestions.id, id)).returning();
        return result[0];
    }

    async delete(id: string, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client.delete(providerQuestions).where(eq(providerQuestions.id, id)).returning();
        return result[0];
    }
}
`;
    writeFile(filePath, newContent);
}

console.log('\n✅ All fixes applied successfully!');
