import { NextResponse, NextRequest } from "next/server";
import { unifiedApiHandler } from "@/lib/middleware/handlers";
import { okResponse, errorResponse } from '@/lib/middleware/responses/ApiResponse';

/**
 * GET /api/workspaces/student/[workspaceId]/learning/session
 * Fetch active learning session for a specific context
 */
export const GET = unifiedApiHandler(
    async (request: NextRequest, { module, auth, log }) => {
        try {
            const { searchParams } = new URL(request.url);
            const contextType = searchParams.get('contextType') as 'quiz' | 'homework' | 'topic';
            const contextId = searchParams.get('contextId');

            if (!contextType || !contextId) {
                return errorResponse("contextType and contextId are required", 400);
            }

            const result = await module.aiSession.get(
                auth.accountId,
                contextId,
                contextType
            );

            if (!result.success) {
                log.error("Failed to fetch learning session", { contextType, contextId, error: result.error });
                return errorResponse(result.error);
            }

            return okResponse(result.data);

        } catch (error) {
            log.error("Learning session fetch error", error);
            return errorResponse("Invalid request", 400);
        }
    }
);
