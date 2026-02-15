import { NextRequest } from 'next/server';
import { unifiedApiHandler } from '@/lib/middleware/handlers';
import { serverErrorResponse, paginatedResponse } from '@/lib/middleware/responses/ApiResponse';
export const GET = unifiedApiHandler(async (request: NextRequest, { module }) => {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const search = searchParams.get('search') || undefined;

    const result = await module.workspace.staffListProviderApplications({ page, pageSize, search });

    if (!result.success) {
        return serverErrorResponse(result.error);
    }

    return paginatedResponse(result.applications, {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        totalPages: Math.ceil(result.total / result.pageSize),
    });
});
