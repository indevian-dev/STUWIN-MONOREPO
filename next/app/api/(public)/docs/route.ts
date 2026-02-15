import { NextRequest } from 'next/server';
import { unifiedApiHandler } from "@/lib/middleware/handlers";
import { okResponse, errorResponse, serverErrorResponse } from '@/lib/middleware/responses/ApiResponse';

export const GET = unifiedApiHandler(async (request: NextRequest, { module }) => {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');

        if (!type) {
            return errorResponse('Type parameter is required', 400);
        }

        const result = await module.content.getPage(type);

        if (!result.success) {
            return errorResponse(result.error, (result as any).code || 404);
        }

        return okResponse({ doc: result.data, success: true });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch doc';
        return serverErrorResponse(errorMessage);
    }
});
