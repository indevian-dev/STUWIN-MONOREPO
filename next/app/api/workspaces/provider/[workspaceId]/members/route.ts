import { NextRequest, NextResponse } from 'next/server';
import { unifiedApiHandler } from '@/lib/middleware/handlers';

export const GET = unifiedApiHandler(async (request: NextRequest, { module, params }) => {
    try {
        const workspaceId = params.workspaceId;
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');

        if (!workspaceId) {
            return NextResponse.json({ error: 'Workspace ID is required' }, { status: 400 });
        }

        const result = await module.workspace.listProviderMembers(workspaceId, page, limit);

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json(result.data, { status: 200 });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to list members';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
});
