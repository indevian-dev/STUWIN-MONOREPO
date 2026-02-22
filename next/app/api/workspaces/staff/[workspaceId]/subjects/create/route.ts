import { NextRequest } from 'next/server';
import { unifiedApiHandler } from '@/lib/middleware/_Middleware.index';
import { createdResponse, errorResponse, serverErrorResponse } from '@/lib/middleware/Response.Api.middleware';
import { SubjectCreateSchema } from '@/lib/domain/learning/Learning.inputs';

export const POST = unifiedApiHandler(async (request: NextRequest, { module }) => {
  try {
    const body = await request.json();

    const parsed = SubjectCreateSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0]?.message || "Validation failed");
    }

    const { title, description, aiLabel, language, gradeLevel } = parsed.data;

    const result = await module.subject.create({
      title,
      description: description || '',
      language: language || 'az',
      gradeLevel: gradeLevel || 1,
      aiLabel,
      isGlobal: true,
      organizationId: 'org_platform'
    });

    if (!result.success) {
      return errorResponse(result.error, 400);
    }

    return createdResponse(result.data);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create subject';
    return serverErrorResponse(errorMessage);
  }
});
