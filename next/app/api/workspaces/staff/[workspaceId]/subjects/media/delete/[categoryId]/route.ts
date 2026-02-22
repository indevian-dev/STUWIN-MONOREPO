import { NextRequest } from 'next/server';
import { unifiedApiHandler } from '@/lib/middleware/_Middleware.index';
import { errorResponse, messageResponse, serverErrorResponse } from '@/lib/middleware/Response.Api.middleware';

export const POST = unifiedApiHandler(async (request: NextRequest, { module, params }) => {
    try {
        const { categoryId } = params || {};

        if (!categoryId) {
            return errorResponse("Valid category ID is required");
        }

        const body = await request.json();
        const { fileName } = body;

        if (!fileName) {
            return errorResponse("File name is required");
        }

        const result = await module.subject.deleteMedia(categoryId, fileName);

        if (!result.success) {
            const status = result.error === 'Subject not found' ? 404 : 500;
            return errorResponse(result.error, status);
        }

        return messageResponse("Media deleted successfully");
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error deleting media';
        return serverErrorResponse(errorMessage);
    }
});
