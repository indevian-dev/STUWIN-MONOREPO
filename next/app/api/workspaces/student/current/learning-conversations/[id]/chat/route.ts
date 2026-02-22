import { NextRequest } from 'next/server';
import { unifiedApiHandler, type UnifiedContext } from "@/lib/middleware/Interceptor.Api.middleware";
import { okResponse, errorResponse } from '@/lib/middleware/Response.Api.middleware';

/**
 * POST /api/workspaces/student/current/learning-conversations/[id]/chat
 * Send a message to an AI learning session
 */
export const POST = unifiedApiHandler(
    async (req: NextRequest, { module, log, params }: UnifiedContext) => {
        try {
            const sessionId = params.id;
            const body = await req.json();
            const { message } = body;

            if (!message) {
                return errorResponse("Message is required", 400);
            }

            const result = await module.aiSession.addMessage(sessionId, message);

            if (!result.success) {
                return errorResponse(result.error);
            }

            return okResponse(result.data);
        } catch (error) {
            log.error("Learning conversation chat error", error);
            return errorResponse("Invalid request", 400);
        }
    },
    {
        method: "POST",
        authRequired: true,
    },
);
