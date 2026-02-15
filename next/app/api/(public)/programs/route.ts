
import { unifiedApiHandler } from "@/lib/middleware/handlers";
import { okResponse, serverErrorResponse } from '@/lib/middleware/responses/ApiResponse';

/**
 * GET /api/programs
 * Public search for educational programs (providers)
 */
export const GET = unifiedApiHandler(async (request, { module }) => {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1", 10);
        const pageSize = Math.min(
            parseInt(searchParams.get("pageSize") || "24", 10),
            100,
        );
        const search = searchParams.get("query") || searchParams.get("search") || "";
        const sortField = searchParams.get("sort") || "createdAt";
        const orderDir = (searchParams.get("order") || "desc") as 'asc' | 'desc';
        const offset = (page - 1) * pageSize;

        const result = await module.workspace.listProviders({
            limit: pageSize,
            offset,
            sortField,
            orderDir,
            search
        });

        if (!result.success || !result.data) {
            return serverErrorResponse(result.error || "Failed to fetch programs");
        }

        const { data, total } = result.data;

        return okResponse({ success: true, programs: data, total, page, pageSize,  });
    } catch (error) {
        console.error('Error in programs API:', error);
        return serverErrorResponse(error instanceof Error ? error.message : 'Internal server error',);
    }
}, {
    authRequired: false,
});
