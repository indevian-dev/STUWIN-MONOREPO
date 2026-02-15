import { NextRequest } from 'next/server';
import { unifiedApiHandler, type UnifiedContext } from "@/lib/middleware/handlers/ApiInterceptor";
import { okResponse, errorResponse } from '@/lib/middleware/responses/ApiResponse';

/**
 * POST /api/workspaces/student/[workspaceId]/learning/analyze
 * Generic learning session analysis/exploration
 */
export const POST = unifiedApiHandler(
    async (request: NextRequest, { module, auth, log, params }: UnifiedContext) => {
        try {
            const body = await request.json();
            const { contextType, contextId, question, locale } = body;

            if (!contextType || !contextId || !question) {
                return errorResponse("contextType, contextId, and question are required", 400);
            }

            const result = await module.aiSession.analyzeLearningContext({
                ...body,
                locale: locale || 'en', // Fallback to English
                accountId: auth.accountId,
                workspaceId: params?.workspaceId as string
            });

            if (!result.success) {
                log.error("Failed to analyze learning context", { contextType, contextId, error: result.error });
                return errorResponse(result.error);
            }

            return okResponse(result.data);

        } catch (error) {
            log.error("Learning analysis error", error);
            return errorResponse("Invalid request", 400);
        }
    },
);
