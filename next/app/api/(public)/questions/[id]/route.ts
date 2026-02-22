import { unifiedApiHandler } from '@/lib/middleware/_Middleware.index';
import { okResponse, errorResponse } from '@/lib/middleware/Response.Api.middleware';

export const GET = unifiedApiHandler(async (request, { module, params }) => {
  const { id } = await params;

  if (!id) {
    return errorResponse("Valid question ID is required", 400);
  }

  const questionResult = await module.question.getById(id as string);

  if (!questionResult.success || !questionResult.data) {
    return errorResponse("Question not found", 404, "NOT_FOUND");
  }

  const questionData = questionResult.data;

  // Check if active (published)
  // The repo result includes { question: ..., subject: ... } structure now
  const { question } = questionData as any; // Type assertion as repo returns joined object now

  if (!question.isPublished) {
    return errorResponse("Question not found or not active", 404, "NOT_FOUND");
  }

  // Map to legacy format
  const legacyQuestion = module.question.mapToLegacy(questionData);

  return okResponse(legacyQuestion);
});
