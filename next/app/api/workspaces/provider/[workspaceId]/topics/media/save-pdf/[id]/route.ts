import { NextRequest } from 'next/server';
import { unifiedApiHandler } from "@/lib/middleware/handlers";
import { okResponse, errorResponse } from '@/lib/middleware/responses/ApiResponse';

export const POST = unifiedApiHandler(
  async (request: NextRequest, { module, params }) => {
    const topicId = params?.id as string;

    if (!topicId) {
      return errorResponse("Valid topic ID is required", 400);
    }

    const { s3Key, pdfPageStart, pdfPageEnd, chapterNumber } = await request.json();

    if (!s3Key) {
      return errorResponse("s3Key is required", 400);
    }

    const result = await module.topic.savePdfMetadata(topicId, {
      s3Key,
      pdfPageStart,
      pdfPageEnd,
      chapterNumber
    });

    if (!result.success) {
      return errorResponse(result.error, (result as any).code || 404);
    }

    return okResponse(result.data, result.error);
  }
);
