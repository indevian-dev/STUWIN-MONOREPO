
import { unifiedApiHandler } from "@/lib/app-access-control/interceptors/ApiInterceptor";
import { ModuleFactory } from "@/lib/app-core-modules/factory";
import { NextResponse } from "next/server";

export const POST = unifiedApiHandler(async (req, { ctx }) => {
    const modules = new ModuleFactory(ctx);
    const url = new URL(req.url);
    const transactionId = url.pathname.split('/').pop();

    if (!transactionId) {
        return NextResponse.json({ success: false, error: "Transaction ID missing" }, { status: 400 });
    }

    try {
        const result = await modules.payment.checkPaymentStatus(transactionId);
        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
});
