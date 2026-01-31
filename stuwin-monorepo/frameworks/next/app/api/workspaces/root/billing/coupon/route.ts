import { NextResponse } from "next/server";
import { unifiedApiHandler } from "@/lib/app-access-control/interceptors";

/**
 * POST /api/workspaces/root/billing/coupon
 * Validate and apply a coupon
 */
export const POST = unifiedApiHandler(async (req, { module, log }) => {
    try {
        const body = await req.json();
        const { code } = body;

        if (!code) {
            return NextResponse.json({ success: false, error: "Coupon code is required" }, { status: 400 });
        }

        const coupon = await module.payment.applyCoupon(code);

        return NextResponse.json({
            success: true,
            data: coupon,
        });
    } catch (error: any) {
        if (log) log.error("Coupon application error", error);
        return NextResponse.json({ success: false, error: error.message || "Invalid coupon" }, { status: 400 });
    }
});
