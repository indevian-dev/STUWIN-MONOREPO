import { NextRequest, NextResponse } from 'next/server';
import { unifiedApiHandler } from '@/lib/middleware/handlers';

export const GET = unifiedApiHandler(async (request: NextRequest, { module, params }) => {
    const providerId = (await params).providerId as string;

    if (!providerId) {
        return NextResponse.json({ error: 'Provider ID is required' }, { status: 400 });
    }

    try {
        const result = await module.workspace.getWorkspace(providerId);

        if (!result) {
            return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
        }

        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        const msg = error instanceof Error ? error.message : 'Failed to fetch provider';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
});

export const PATCH = unifiedApiHandler(async (request: NextRequest, { module, params }) => {
    const providerId = (await params).providerId as string;
    const body = await request.json();

    if (!providerId) {
        return NextResponse.json({ error: 'Provider ID is required' }, { status: 400 });
    }

    try {
        const result = await module.workspace.staffUpdateProvider(providerId, body);

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        const msg = error instanceof Error ? error.message : 'Failed to update provider';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
});

export const DELETE = unifiedApiHandler(async (request: NextRequest, { module, params }) => {
    const providerId = (await params).providerId as string;

    if (!providerId) {
        return NextResponse.json({ error: 'Provider ID is required' }, { status: 400 });
    }

    try {
        const result = await module.workspace.staffDeleteProvider(providerId);

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        const msg = error instanceof Error ? error.message : 'Failed to delete provider';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
});
