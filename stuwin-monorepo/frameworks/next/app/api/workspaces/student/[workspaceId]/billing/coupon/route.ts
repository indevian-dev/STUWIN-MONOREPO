
import { NextResponse } from 'next/server';
import { unifiedApiHandler } from '@/lib/app-access-control/interceptors';

export const POST = unifiedApiHandler(async (request, { module, log }) => {
    try {
        const body = await request.json();
        const { code } = body;

        if (!code) {
            return NextResponse.json(
                { success: false, error: 'Coupon code is required' },
                { status: 400 }
            );
        }

        const coupon = await module.payment.applyCoupon(code);

        return NextResponse.json({
            success: true,
            data: coupon,
        });
    } catch (error: any) {
        log.error('Coupon validation error', error as Error);
        return NextResponse.json(
            { success: false, error: error.message || 'Invalid coupon' },
            { status: 400 }
        );
    }
});
