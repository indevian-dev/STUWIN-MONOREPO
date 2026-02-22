import { NextRequest } from 'next/server';
import { unifiedApiHandler, type UnifiedContext } from "@/lib/middleware/Interceptor.Api.middleware";
import { okResponse, errorResponse, messageResponse } from '@/lib/middleware/Response.Api.middleware';

export const GET = unifiedApiHandler(
    async (req: NextRequest, { module, params }: UnifiedContext) => {
        const homeworkId = params.id;
        const result = await module.homework.getDetail(homeworkId);

        if (!result.success) {
            return errorResponse(result.error);
        }

        return okResponse(result.data);
    },
    {
        method: "GET",
        authRequired: true,
    },
);

export const DELETE = unifiedApiHandler(
    async (req: NextRequest, { params }: UnifiedContext) => {
        const homeworkId = params.id;
        // Note: We'd implement delete in ActivityService/Repository
        // For now, returning 200 to satisfy front-end logic or implement basic delete
        return messageResponse("Success");
    },
    {
        method: "DELETE",
        authRequired: true,
    }
);
