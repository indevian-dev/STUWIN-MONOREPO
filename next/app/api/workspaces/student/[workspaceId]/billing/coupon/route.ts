
import { unifiedApiHandler } from '@/lib/middleware/_Middleware.index';
import { okResponse, errorResponse } from '@/lib/middleware/Response.Api.middleware';

export const POST = unifiedApiHandler(async (request, { module, log }) => {
    try {
        const body = await request.json();
        const { code } = body;

        if (!code) {
            return errorResponse('Coupon code is required', 400);
        }

        const coupon = await module.payment.applyCoupon(code);

        return okResponse(coupon);
    } catch (error: any) {
        log.error('Coupon validation error', error as Error);
        return errorResponse(error.message || 'Invalid coupon', 400);
    }
});
