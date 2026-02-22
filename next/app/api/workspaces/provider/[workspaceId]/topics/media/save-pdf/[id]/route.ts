import { NextRequest } from 'next/server';
import { unifiedApiHandler } from "@/lib/middleware/_Middleware.index";
import { okResponse, errorResponse } from '@/lib/middleware/Response.Api.middleware';

export const POST = unifiedApiHandler(
  async (request: NextRequest, { module, params }) => {
    const topicId = params?.id as string;

    if (!topicId) {
      return errorResponse("Valid topic ID is required", 400);
    }

    const { fileName, pdfPageStart, pdfPageEnd, chapterNumber } = await request.json();

    if (!fileName) {
      return errorResponse("fileName is required", 400);
    }

    const result = await module.topic.savePdfMetadata(topicId, {
      fileName,
      pdfPageStart,
      pdfPageEnd,
      chapterNumber
    } as any); // Cast as any locally right now since types are updated upstream

    if (!result.success) {
      return errorResponse(result.error, (result as any).code || 400);
    }

    return okResponse(result.data, result.error);
  }
);
