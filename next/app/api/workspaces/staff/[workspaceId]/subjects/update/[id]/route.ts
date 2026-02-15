import { NextRequest } from 'next/server';
import { unifiedApiHandler } from '@/lib/middleware/handlers';
import { okResponse, errorResponse, serverErrorResponse } from '@/lib/middleware/responses/ApiResponse';
import { SubjectUpdateSchema } from '@/lib/domain/learning/learning.inputs';

export const PUT = unifiedApiHandler(async (request: NextRequest, { module, params }) => {
  try {
    const { id: subjectId } = params || {};
    if (!subjectId) {
      return errorResponse("Subject ID is required");
    }

    const body = await request.json();

    const parsed = SubjectUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0]?.message || "Validation failed");
    }

    const result = await module.subject.update(subjectId, parsed.data);

    if (!result.success) {
      const status = result.error === 'Subject not found' ? 404 : 400;
      return errorResponse(result.error, status);
    }

    return okResponse(result.data);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update subject';
    return serverErrorResponse(errorMessage);
  }
});

export const PATCH = unifiedApiHandler(async (request: NextRequest, { module, params }) => {
  try {
    const { id: subjectId } = params || {};
    if (!subjectId) {
      return errorResponse("Subject ID is required");
    }

    const body = await request.json();

    const parsed = SubjectUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0]?.message || "Validation failed");
    }

    const result = await module.subject.update(subjectId, parsed.data);

    if (!result.success) {
      const status = result.error === 'Subject not found' ? 404 : 400;
      return errorResponse(result.error, status);
    }

    return okResponse(result.data);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update subject status';
    return serverErrorResponse(errorMessage);
  }
});
