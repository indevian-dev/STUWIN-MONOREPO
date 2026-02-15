import { NextRequest } from 'next/server';
import { unifiedApiHandler, type UnifiedContext } from "@/lib/middleware/handlers/ApiInterceptor";
import { okResponse, errorResponse } from '@/lib/middleware/responses/ApiResponse';

/**
 * GET /api/workspaces/student/[workspaceId]/homeworks/[id]
 * Get individual homework details
 */
export const GET = unifiedApiHandler(
    async (request: NextRequest, { module, auth, log, params }: UnifiedContext) => {
        const homeworkId = params?.id as string;
        if (!homeworkId) {
            return errorResponse("Homework ID is required", 400);
        }

        const result = await module.homework.getDetail(homeworkId);

        if (!result.success) {
            log.error("Failed to get homework detail", { homeworkId, error: result.error });
            return errorResponse(result.error, 404);
        }

        // Access control: Ensure the homework belongs to the student
        if (!result.data || result.data.studentAccountId !== auth.accountId) {
            return errorResponse("Access denied", 403);
        }

        return okResponse(result.data);
    },
);
