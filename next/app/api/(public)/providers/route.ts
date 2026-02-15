
import { unifiedApiHandler } from "@/lib/middleware/handlers";
import { okResponse, serverErrorResponse } from '@/lib/middleware/responses/ApiResponse';

export const GET = unifiedApiHandler(async (request, { module }) => {
    const { searchParams } = new URL(request.url);
    const hasAnyParam = Array.from(searchParams.keys()).length > 0;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = Math.min(
        parseInt(searchParams.get("pageSize") || "24", 10),
        100,
    );
    const sortField = searchParams.get("sort") || "createdAt";
    const orderDir = (searchParams.get("order") || "desc") as 'asc' | 'desc';
    const offset = (page - 1) * pageSize;

    const result = await module.workspace.listProviders({
        limit: pageSize,
        offset,
        sortField,
        orderDir
    });

    if (!result.success || !result.data) {
        return serverErrorResponse(result.error || "Failed to fetch providers");
    }

    const { data, total } = result.data;

    // Backward-compatible response for callers without query params
    if (!hasAnyParam) {
        return okResponse(data);
    }

    return okResponse({ providers: data, total: total, page: page, pageSize: pageSize });
});
