import { NextRequest } from 'next/server';
import { unifiedApiHandler } from "@/lib/middleware/_Middleware.index";
import { okResponse, errorResponse } from '@/lib/middleware/Response.Api.middleware';

export const POST = unifiedApiHandler(
  async (request: NextRequest, { module }) => {
    const body = await request.json();
    const { pdfKey, subjectId, gradeLevel } = body;

    if (!pdfKey || !subjectId || !gradeLevel) {
      return errorResponse("pdfKey, subjectId, and gradeLevel are required", 400);
    }

    const result = await module.topic.analyzeBook({ pdfKey, subjectId, gradeLevel });

    if (!result.success) {
      return errorResponse(result.error, (result as any).code || 500);
    }

    return okResponse(result);
  }
);
