import { NextResponse } from "next/server";
import { unifiedApiHandler } from "@/lib/middleware/handlers/ApiInterceptor";
import { ModuleFactory } from "@/lib/domain/factory";

export const POST = unifiedApiHandler(async (req, { ctx }) => {
    const modules = new ModuleFactory(ctx);
    const body = await req.json();
    const { code } = body;

    if (!code) {
        return NextResponse.json({ success: false, error: "Coupon code is required" }, { status: 400 });
    }

    try {
        const coupon = await modules.payment.applyCoupon(code);
        return NextResponse.json(coupon);
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
});
