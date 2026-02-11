import { NextRequest, NextResponse } from 'next/server';
import { unifiedApiHandler } from '@/lib/middleware/handlers';

export const PUT = unifiedApiHandler(async (request: NextRequest, { module, params }) => {
    const applicationId = (await params).applicationId as string;
    const body = await request.json();
    const { action } = body;

    if (!applicationId) {
        return NextResponse.json({ error: 'Application ID is required' }, { status: 400 });
    }

    if (!action || !['approve', 'reject'].includes(action)) {
        return NextResponse.json({ error: 'action must be "approve" or "reject"' }, { status: 400 });
    }

    try {
        const result = await module.workspace.staffEvaluateApplication(applicationId, action);

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        const msg = error instanceof Error ? error.message : 'Failed to evaluate application';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
});
