import { NextRequest } from 'next/server';
import { unifiedApiHandler } from '@/lib/middleware/_Middleware.index';
import { okResponse, errorResponse } from '@/lib/middleware/Response.Api.middleware';

// GET /api/(public)/questions/by-subject?slug=xyz
export const GET = unifiedApiHandler(async (request: NextRequest, { module }) => {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
  const complexity = searchParams.get('complexity') || undefined;
  const gradeLevel = searchParams.get('gradeLevel') ? parseInt(searchParams.get('gradeLevel')!) : undefined;

  if (!slug) {
    return errorResponse('Subject slug is required', 400);
  }

  const result = await module.question.getBySubject({
    slug,
    page,
    pageSize,
    complexity,
    gradeLevel
  });

  if (!result.success) {
    return errorResponse(result.error, (result as any).code || 500);
  }

  return okResponse(result.data);
}, { authRequired: false });
