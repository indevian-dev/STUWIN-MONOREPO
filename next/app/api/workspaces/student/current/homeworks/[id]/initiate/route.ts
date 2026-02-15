import { NextRequest } from 'next/server';
import { unifiedApiHandler, type UnifiedContext } from "@/lib/middleware/handlers/ApiInterceptor";
import { okResponse, errorResponse } from '@/lib/middleware/responses/ApiResponse';

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
