
import { NextResponse } from 'next/server';
import { unifiedApiHandler } from '@/lib/app-access-control/interceptors';

export const GET = unifiedApiHandler(async (_request, { module, log }) => {
    try {
        const result = await module.payment.getAvailableTiers();

        return NextResponse.json({
            success: true,
            data: result,
        });
    } catch (error) {
        log.error('Tiers fetch error', error as Error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
});
