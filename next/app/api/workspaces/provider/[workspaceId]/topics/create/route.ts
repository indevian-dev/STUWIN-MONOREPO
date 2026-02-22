import type { NextRequest } from 'next/server';
import { unifiedApiHandler, type UnifiedContext } from '@/lib/middleware/_Middleware.index';
import { createdResponse, errorResponse, serverErrorResponse } from '@/lib/middleware/Response.Api.middleware';

export const POST = unifiedApiHandler(async (request: NextRequest, { module, auth }: UnifiedContext) => {
  try {
    const body = await request.json();
    const {
      name,
      description,
      body: topicBody, // compatibility 
      ai_summary,
      grade_level,
      subject_id,
      language,
      pdfId
    } = body;

    if (!name) {
      return errorResponse('Topic name is required', 400);
    }

    if (!subject_id) {
      return errorResponse('Subject ID is required', 400);
    }

    const result = await module.topic.createWithContent(subject_id, {
      name,
      description: description || topicBody || '',
      gradeLevel: grade_level ? parseInt(String(grade_level)) : undefined,
      language,
      pdfId,
      providerSubjectId: subject_id
    });

    if (!result.success) {
      return errorResponse(result.error, 400);
    }

    return createdResponse(result.data);
  } catch (error) {
    return serverErrorResponse(error instanceof Error ? error.message : 'Failed to create topic');
  }
});
