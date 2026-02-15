import { NextRequest } from 'next/server';
import { unifiedApiHandler } from "@/lib/middleware/handlers";
import { errorResponse, okResponse } from '@/lib/middleware/responses/ApiResponse';

export const POST = unifiedApiHandler(
  async (request: NextRequest, { params, module, isValidSlimId }) => {
    const subjectId = params?.id as string;

    if (!subjectId || !isValidSlimId(subjectId)) {
      return errorResponse("Invalid subject ID", 400);
    }

    const { fileName, fileType } = await request.json();
    const result = await module.subject.getPdfUploadUrl(subjectId, fileName, fileType);

    if (!result.success) {
      return errorResponse(result.error, 200);
    }

    return okResponse(result.data);
  }
);