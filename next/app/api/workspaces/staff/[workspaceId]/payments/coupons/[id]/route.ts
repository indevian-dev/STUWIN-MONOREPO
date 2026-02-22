import { okResponse, errorResponse, messageResponse } from '@/lib/middleware/Response.Api.middleware';
import { unifiedApiHandler } from "@/lib/middleware/_Middleware.index";

/**
 * PUT | DELETE /api/workspaces/staff/[workspaceId]/payments/coupons/[id]
 * Update or Delete a coupon
 */
export const PUT = unifiedApiHandler(async (req, { module, params, log }) => {
    try {
        const { id } = await params;
        if (!id) return errorResponse("Missing ID", 400);

        const body = await req.json();
        const coupon = await module.payment.updateCoupon(id, body);
        return okResponse(coupon);
    } catch (error: any) {
        if (log) log.error("Failed to update coupon", error);
        return errorResponse(error.message);
    }
});

export const DELETE = unifiedApiHandler(async (req, { module, params, log }) => {
    try {
        const { id } = await params;
        if (!id) return errorResponse("Missing ID", 400);

        await module.payment.deleteCoupon(id);
        return messageResponse("Success");
    } catch (error: any) {
        if (log) log.error("Failed to delete coupon", error);
        return errorResponse(error.message);
    }
});
