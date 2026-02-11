import { NextResponse } from "next/server";
import { unifiedApiHandler } from "@/lib/middleware/handlers";

/**
 * GET | POST /api/workspaces/staff/[workspaceId]/payments/coupons
 * List or Create coupons
 */
export const GET = unifiedApiHandler(async (req, { module, log }) => {
    try {
        // TODO: Enforce permission STAFF_PAYMENT_MANAGE if needed
        const coupons = await module.payment.listCoupons();
        return NextResponse.json({ success: true, data: coupons });
    } catch (error) {
        if (log) log.error("Failed to list coupons", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
});

export const POST = unifiedApiHandler(async (req, { module, log }) => {
    try {
        // TODO: Enforce permission STAFF_PAYMENT_MANAGE
        const body = await req.json();
        const coupon = await module.payment.createCoupon(body);
        return NextResponse.json({ success: true, data: coupon });
    } catch (error: any) {
        if (log) log.error("Failed to create coupon", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
});
