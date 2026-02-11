import { NextRequest, NextResponse } from 'next/server';
import { unifiedApiHandler } from '@/lib/middleware/handlers';

export const GET = unifiedApiHandler(async (request: NextRequest, { module }) => {
    try {
        const { searchParams } = new URL(request.url);
        const email = searchParams.get('email') || undefined;
        const phone = searchParams.get('phone') || undefined;
        const fin = searchParams.get('fin') || undefined;

        if (!email && !phone && !fin) {
            return NextResponse.json(
                { error: 'At least one search parameter (email, phone, or fin) is required' },
                { status: 400 }
            );
        }

        const result = await module.auth.searchAccounts({ email, phone, fin });

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: result.status || 500 });
        }

        return NextResponse.json(result.data, { status: 200 });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to search accounts';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
});
