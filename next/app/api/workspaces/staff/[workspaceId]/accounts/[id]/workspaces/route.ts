import { NextRequest, NextResponse } from 'next/server';
import { unifiedApiHandler } from '@/lib/middleware/handlers';

export const GET = unifiedApiHandler(async (request: NextRequest, { module, params }) => {
    try {
        const accountId = params.id;

        if (!accountId) {
            return NextResponse.json({ error: 'Account ID is required' }, { status: 400 });
        }

        const result = await module.workspace.listWorkspacesForAccount(accountId);

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json(result.data, { status: 200 });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to list workspaces';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
});
