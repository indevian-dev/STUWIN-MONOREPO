import { NextRequest } from 'next/server';
import { unifiedApiHandler, type UnifiedContext } from "@/lib/middleware/Interceptor.Api.middleware";
import { okResponse, createdResponse, errorResponse } from '@/lib/middleware/Response.Api.middleware';

/**
 * GET /api/workspaces/student/current/homeworks
 * List all homeworks for the student's active workspace
 */
export const GET = unifiedApiHandler(
    async (req: NextRequest, { module, auth, log }: UnifiedContext) => {
        const result = await module.homework.list(auth.accountId!);

        if (!result.success) {
            log.error("Failed to list homeworks", { error: result.error });
            return errorResponse(result.error);
        }

        return okResponse(result.data);
    },
    {
        method: "GET",
        authRequired: true,
    },
);

/**
 * POST /api/workspaces/student/current/homeworks
 * Create a new homework submission
 */
export const POST = unifiedApiHandler(
    async (req: NextRequest, { module, auth, log }: UnifiedContext) => {
        try {
            const body = await req.json();

            if (!body.title) {
                return errorResponse("Title is required", 400);
            }

            const result = await module.homework.submit(auth.accountId!, {
                title: body.title,
                workspaceId: auth.activeWorkspaceId!,
                topicId: body.topicId,
                description: body.description,
                textContent: body.textContent,
                media: body.media || [],
            });

            if (!result.success) {
                log.error("Failed to submit homework", { error: result.error });
                return errorResponse(result.error);
            }

            return createdResponse(result.data);
        } catch (error) {
            log.error("POST homework error", error);
            return errorResponse("Invalid request", 400);
        }
    },
    {
        method: "POST",
        authRequired: true,
    }
);
