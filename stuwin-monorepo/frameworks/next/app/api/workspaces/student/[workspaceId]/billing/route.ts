
import { NextResponse } from 'next/server';
import { unifiedApiHandler } from '@/lib/app-access-control/interceptors';

export const GET = unifiedApiHandler(async (_request, { module, log }) => {
    try {
        const status = await module.payment.getSubscriptionStatus();

        return NextResponse.json({
            success: true,
            data: status,
        });
    } catch (error) {
        log.error('Billing status fetch error', error as Error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
});

export const POST = unifiedApiHandler(async (request, { module, params, log }) => {
    try {
        const body = await request.json();
        const { tierId, couponCode, language } = body;

        if (!tierId) {
            return NextResponse.json(
                { success: false, error: 'tierId is required' },
                { status: 400 }
            );
        }

        const { workspaceId } = params as { workspaceId: string };
        const result = await module.payment.initiatePayment({
            tierId,
            scope: 'WORKSPACE',
            scopeId: workspaceId,
            couponCode,
            language: language || 'az'
        });

        return NextResponse.json({
            success: true,
            data: result,
        });
    } catch (error: any) {
        log.error('Payment initiation error', error as Error);
        return NextResponse.json(
            { success: false, error: error.message || 'Payment failed' },
            { status: 400 }
        );
    }
});
