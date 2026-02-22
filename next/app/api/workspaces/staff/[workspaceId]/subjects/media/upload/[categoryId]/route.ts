import { NextRequest } from 'next/server';
import { unifiedApiHandler } from '@/lib/middleware/_Middleware.index';

import { okResponse, errorResponse, serverErrorResponse } from '@/lib/middleware/Response.Api.middleware';
export const POST = unifiedApiHandler(async (request: NextRequest, { module, params }) => {
    try {
        const { categoryId } = params || {};

        if (!categoryId) {
            return errorResponse("Valid category ID (subjectId) is required");
        }

        const result = await module.subject.getCoverUploadUrlLegacy(categoryId);

        if (!result.success) {
            const status = result.error === 'Subject not found' ? 404 : 500;
            return errorResponse(result.error, status);
        }

        return okResponse(result.data);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error generating presigned URL';
        return serverErrorResponse(errorMessage);
    }
});
