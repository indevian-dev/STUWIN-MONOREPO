import { NextRequest } from 'next/server';
import { unifiedApiHandler } from '@/lib/middleware/handlers';

import { okResponse, errorResponse, serverErrorResponse } from '@/lib/middleware/responses/ApiResponse';
export const GET = unifiedApiHandler(async (request: NextRequest, { module }) => {
    try {
        const { searchParams } = new URL(request.url);
        const email = searchParams.get('email') || undefined;
        const phone = searchParams.get('phone') || undefined;
        const fin = searchParams.get('fin') || undefined;

        if (!email && !phone && !fin) {
            return errorResponse("At least one search parameter (email, phone, or fin) is required");
        }

        const result = await module.auth.searchAccounts({ email, phone, fin });

        if (!result.success) {
            return serverErrorResponse(result.error);
        }

        return okResponse(result.data);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to search accounts';
        return serverErrorResponse(errorMessage);
    }
});
