import { NextRequest } from 'next/server';
import { unifiedApiHandler, type UnifiedContext } from "@/lib/middleware/Interceptor.Api.middleware";
import { okResponse, errorResponse } from '@/lib/middleware/Response.Api.middleware';

export const POST = unifiedApiHandler(
    async (req: NextRequest, { module, params }: UnifiedContext) => {
        const homeworkId = params.id;
        const result = await module.homework.initiateAiSession(homeworkId);

        if (!result.success) {
            return errorResponse(result.error);
        }

        return okResponse(result.data);
    },
    {
        method: "POST",
        authRequired: true,
    },
);
