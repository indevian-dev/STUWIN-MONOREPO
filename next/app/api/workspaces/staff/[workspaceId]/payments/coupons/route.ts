import { unifiedApiHandler } from "@/lib/middleware/handlers";
import { okResponse, errorResponse, serverErrorResponse } from '@/lib/middleware/responses/ApiResponse';

/**
 * GET | POST /api/workspaces/staff/[workspaceId]/payments/coupons
 * List or Create coupons
 */
export const GET = unifiedApiHandler(async (req, { module, log }) => {
    try {
        // TODO: Enforce permission STAFF_PAYMENT_MANAGE if needed
        const coupons = await module.payment.listCoupons();
        return okResponse(coupons);
    } catch (error) {
        if (log) log.error("Failed to list coupons", error);
        return serverErrorResponse("Internal server error");
    }
});

export const POST = unifiedApiHandler(async (req, { module, log }) => {
    try {
        // TODO: Enforce permission STAFF_PAYMENT_MANAGE
        const body = await req.json();
        const coupon = await module.payment.createCoupon(body);
        return okResponse(coupon);
    } catch (error: any) {
        if (log) log.error("Failed to create coupon", error);
        return errorResponse(error.message);
    }
});
