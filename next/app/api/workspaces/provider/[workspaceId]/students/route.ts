import { NextRequest } from 'next/server';
import { unifiedApiHandler } from '@/lib/middleware/handlers';
import { okResponse } from '@/lib/middleware/responses/ApiResponse';

export const GET = unifiedApiHandler(async (request: NextRequest, { module, params }) => {
    const workspaceId = params.workspaceId;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const result = await module.workspace.repository.listEnrolledStudents(
        workspaceId,
        { limit, offset }
    );

    return okResponse({ students: result.students, total: result.total, totalPages: result.totalPages, page: page });
});
