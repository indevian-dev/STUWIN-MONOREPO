import { unifiedApiHandler } from "@/lib/middleware/handlers/ApiInterceptor";
import { okResponse, errorResponse } from '@/lib/middleware/responses/ApiResponse';

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
