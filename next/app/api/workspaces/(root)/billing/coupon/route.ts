import { unifiedApiHandler } from "@/lib/middleware/Interceptor.Api.middleware";
import { okResponse, errorResponse } from '@/lib/middleware/Response.Api.middleware';

export const POST = unifiedApiHandler(async (req, { module }) => {
    const body = await req.json();
    const { code } = body;

    if (!code) {
        return errorResponse("Coupon code is required", 400);
    }

    try {
        const coupon = await module.payment.applyCoupon(code);
        return okResponse(coupon);
    } catch (error: unknown) {
        return errorResponse((error as Error).message, 400);
    }
});
