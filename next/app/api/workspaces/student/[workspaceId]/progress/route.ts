import { NextRequest } from 'next/server';
import { unifiedApiHandler, type UnifiedContext } from "@/lib/middleware/Interceptor.Api.middleware";
import { okResponse, errorResponse } from '@/lib/middleware/Response.Api.middleware';

export const GET = unifiedApiHandler(
    async (request: NextRequest, { module, auth }: UnifiedContext) => {
        const { searchParams } = new URL(request.url);
        const subjectId = searchParams.get("subjectId") || undefined;
        const accountId = auth.accountId;

        const result = await module.quiz.getStudentProgress(accountId, subjectId);

        if (!result.success) {
            return errorResponse(result.error, 400);
        }

        return okResponse(result.data);
    }
);
