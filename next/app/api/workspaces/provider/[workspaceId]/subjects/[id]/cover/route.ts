import { NextRequest } from 'next/server';
import { unifiedApiHandler } from "@/lib/middleware/handlers";
import { errorResponse, okResponse, messageResponse } from '@/lib/middleware/responses/ApiResponse';

export const POST = unifiedApiHandler(
  async (request: NextRequest, { params, module }) => {
    const subjectId = params?.id as string;
    if (!subjectId) {
      return errorResponse("Invalid subject ID", 400);
    }

    const { fileName, fileType } = await request.json();
    const result = await module.subject.getCoverUploadUrl(subjectId, fileName, fileType);

    if (!result.success) {
      return errorResponse(result.error, 200);
    }

    return okResponse(result.data);
  }
);

export const PUT = unifiedApiHandler(
  async (request: NextRequest, { module, params }) => {
    const subjectId = params?.id as string;
    if (!subjectId) {
      return errorResponse("Invalid subject ID", 400);
    }

    const { coverUrl } = await request.json();
    const result = await module.subject.update(subjectId, { cover: coverUrl });

    if (!result.success) {
      return errorResponse(result.error, 400);
    }

    return messageResponse("Cover updated successfully");
  }
);
