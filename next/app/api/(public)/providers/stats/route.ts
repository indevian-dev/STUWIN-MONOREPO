import { NextRequest } from 'next/server';
import { unifiedApiHandler } from "@/lib/middleware/handlers";
import { okResponse, serverErrorResponse } from '@/lib/middleware/responses/ApiResponse';

// GET /api/providers/stats
// Returns statistics about educational providers
export const GET = unifiedApiHandler(
    async (request: NextRequest, { module }) => {
        const result = await module.support.getPublicProviderStats();

        if (!result.success) {
            return serverErrorResponse(result.error);
        }

        return okResponse(result.data);
    },
    {
        authRequired: false
    }
);
