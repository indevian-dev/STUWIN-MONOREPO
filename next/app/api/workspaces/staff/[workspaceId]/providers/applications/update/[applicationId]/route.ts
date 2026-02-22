import { NextRequest } from 'next/server';
import { unifiedApiHandler } from '@/lib/middleware/_Middleware.index';

import { okResponse, errorResponse, serverErrorResponse } from '@/lib/middleware/Response.Api.middleware';
export const PUT = unifiedApiHandler(async (request: NextRequest, { module, params }) => {
    const applicationId = (await params).applicationId as string;
    const body = await request.json();
    const { action } = body;

    if (!applicationId) {
        return errorResponse("Application ID is required");
    }

    if (!action || !['approve', 'reject'].includes(action)) {
        return errorResponse('action must be "approve" or "reject"');
    }

    try {
        const result = await module.workspace.staffEvaluateApplication(applicationId, action);

        if (!result.success) {
            return serverErrorResponse(result.error);
        }

        return okResponse(result);
    } catch (error) {
        const msg = error instanceof Error ? error.message : 'Failed to evaluate application';
        return serverErrorResponse(msg);
    }
});
