import { NextRequest, NextResponse } from 'next/server';
import { unifiedApiHandler } from '@/lib/middleware/handlers';

export const POST = unifiedApiHandler(async (request: NextRequest, { module }) => {
    try {
        const body = await request.json();
        const { accountId, targetWorkspaceId, accessRole } = body;

        if (!accountId || !targetWorkspaceId || !accessRole) {
            return NextResponse.json(
                { error: 'accountId, targetWorkspaceId, and accessRole are required' },
                { status: 400 }
            );
        }

        const result = await module.workspace.addUserToStaffWorkspace({
            accountId,
            targetWorkspaceId,
            accessRole,
        });

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json(result.data, { status: 201 });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to add staff member';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
});
