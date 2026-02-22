
import { unifiedApiHandler } from '@/lib/middleware/_Middleware.index';
import { z } from 'zod';
import { okResponse, createdResponse, errorResponse, serverErrorResponse } from '@/lib/middleware/Response.Api.middleware';

export const GET = unifiedApiHandler(async (request, { module, params }) => {
  const { searchParams } = new URL(request.url);
  const workspaceId = params?.workspaceId as string;
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

  const subjectId = searchParams.get('subjectId') || undefined;

  const complexity = searchParams.get('complexity') || undefined;
  const gradeLevelParam = searchParams.get('gradeLevel');
  const gradeLevel = gradeLevelParam ? parseInt(gradeLevelParam, 10) : undefined;

  const filterAuthorId = searchParams.get('authorAccountId') || undefined;

  // published=true → only published, published=false → only unpublished, absent → all
  const publishedParam = searchParams.get('published');
  const onlyPublished = publishedParam === 'true';
  const onlyUnpublished = publishedParam === 'false';

  const result = await module.question.list({
    page,
    pageSize,
    subjectId,
    complexity,
    gradeLevel,
    authorAccountId: filterAuthorId,
    onlyPublished,
    onlyUnpublished,
    workspaceId
  });

  if (!result.success || !result.data) {
    return serverErrorResponse(result.error || "Failed");
  }

  const { questions, pagination } = result.data;

  return okResponse({
    questions,
    ...pagination
  });
});

// Legacy question create — uses snake_case fields from old frontend
const LegacyQuestionCreateSchema = z.object({
  body: z.string().min(5, 'Question body must be at least 5 characters'),
  subject_id: z.string().min(1, 'subject_id is required'),
  grade_level: z.coerce.number().int().min(1).max(12),
  complexity: z.enum(['easy', 'medium', 'hard', 'expert']),
  answers: z.array(z.string()).min(2, 'At least 2 answers required'),
  correct_answer: z.string().min(1, 'correct_answer is required'),
  explanation_guide: z.string().optional(),
});

export const POST = unifiedApiHandler(async (request, { module, auth, params }) => {
  const accountId = auth.accountId;
  try {
    const body = await request.json();

    const parsed = LegacyQuestionCreateSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0]?.message || 'Validation failed', 400);
    }

    const {
      body: questionBody,
      subject_id,
      grade_level,
      complexity,
      answers,
      correct_answer,
      explanation_guide
    } = parsed.data;

    // Verify correct_answer is in answers
    if (!answers.includes(correct_answer)) {
      return errorResponse('Correct answer must be one of the answer options', 400);
    }

    const workspaceId = params?.workspaceId as string;

    // Create via service
    const result = await module.question.create({
      question: questionBody,
      providerSubjectId: subject_id,
      gradeLevel: grade_level,
      complexity,
      answers,
      correctAnswer: correct_answer,
      explanationGuide: explanation_guide ? { content: explanation_guide } : undefined,
      language: 'az', // Default for now
      workspaceId
    }, accountId);

    if (!result.success || !result.data) {
      throw new Error(result.error);
    }

    return createdResponse(result.data, 'Question created successfully');

  } catch (error) {
    console.error('Error creating question:', error);
    return serverErrorResponse(error instanceof Error ? error.message : 'Failed to create question');
  }
});
