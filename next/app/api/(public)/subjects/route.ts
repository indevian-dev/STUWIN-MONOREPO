
import { unifiedApiHandler } from '@/lib/middleware/_Middleware.index';
import { okResponse, serverErrorResponse } from '@/lib/middleware/Response.Api.middleware';

export const GET = unifiedApiHandler(async (request, { module }) => {
  try {
    const result = await module.subject.getPublicSubjects();

    if (!result.success || !(result as any).data) { // Service returns { success, data }
      throw new Error((result as any).error || "Failed to fetch subjects");
    }

    return okResponse((result as any).data);
  } catch (error) {
    return serverErrorResponse('Failed to fetch subjects');
  }
});


