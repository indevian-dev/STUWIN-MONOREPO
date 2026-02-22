
import { unifiedApiHandler } from '@/lib/middleware/_Middleware.index';
import { okResponse, errorResponse, serverErrorResponse } from '@/lib/middleware/Response.Api.middleware';

export const GET = unifiedApiHandler(async (_request, { module, log }) => {
    try {
        const status = await module.payment.getSubscriptionStatus();

        return okResponse(status);
    } catch (error) {
        log.error('Billing status fetch error', error as Error);
        return serverErrorResponse('Internal server error');
    }
});

export const POST = unifiedApiHandler(async (request, { module, params, log }) => {
    try {
        const body = await request.json();
        const { tierId, couponCode, language } = body;

        if (!tierId) {
            return errorResponse('tierId is required', 400);
        }

        const { workspaceId } = params as { workspaceId: string };
        const result = await module.payment.initiatePayment({
            tierId,
            workspaceId: workspaceId,
            couponCode,
            language: language || 'az'
        });

        return okResponse(result);
    } catch (error: any) {
        log.error('Payment initiation error', error as Error);
        return errorResponse(error.message || 'Payment failed', 400);
    }
});
