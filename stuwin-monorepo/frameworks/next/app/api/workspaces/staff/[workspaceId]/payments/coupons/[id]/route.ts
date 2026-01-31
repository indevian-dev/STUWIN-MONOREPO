import { NextResponse } from "next/server";
import { unifiedApiHandler } from "@/lib/app-access-control/interceptors";

/**
 * PUT | DELETE /api/workspaces/staff/[workspaceId]/payments/coupons/[id]
 * Update or Delete a coupon
 */
export const PUT = unifiedApiHandler(async (req, { module, params, log }) => {
    try {
        const { id } = await params;
        if (!id) return NextResponse.json({ success: false, error: "Missing ID" }, { status: 400 });

        const body = await req.json();
        const coupon = await module.payment.updateCoupon(id, body);
        return NextResponse.json({ success: true, data: coupon });
    } catch (error: any) {
        if (log) log.error("Failed to update coupon", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
});

export const DELETE = unifiedApiHandler(async (req, { module, params, log }) => {
    try {
        const { id } = await params;
        if (!id) return NextResponse.json({ success: false, error: "Missing ID" }, { status: 400 });

        await module.payment.deleteCoupon(id);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        if (log) log.error("Failed to delete coupon", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
});
