import { NextRequest } from 'next/server';
import { unifiedApiHandler, type UnifiedContext } from "@/lib/middleware/Interceptor.Api.middleware";
import { okResponse, errorResponse, serverErrorResponse } from '@/lib/middleware/Response.Api.middleware';

/**
 * POST /api/workspaces/student/[workspaceId]/homeworks/[id]/initiate
 * Initiate or resume an AI Socratic learning session for homework
 */
export const POST = unifiedApiHandler(
    async (request: NextRequest, { module, auth, log, params }: UnifiedContext) => {
        const homeworkId = params?.id as string;
        if (!homeworkId) {
            return errorResponse("Homework ID is required", 400);
        }

        const result = await module.homework.initiateAiSession(homeworkId);

        if (!result.success) {
            log.error("Failed to initiate homework session", { homeworkId, error: result.error });
            return serverErrorResponse(result.error);
        }

        return okResponse(result.data);
    },
);
