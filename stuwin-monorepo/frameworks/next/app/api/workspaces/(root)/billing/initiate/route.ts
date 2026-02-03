
import { NextResponse } from "next/server";
import { unifiedApiHandler } from "@/lib/app-access-control/interceptors/ApiInterceptor";
import { ModuleFactory } from "@/lib/app-core-modules/factory";

export const POST = unifiedApiHandler(async (req, { ctx }) => {
    const modules = new ModuleFactory(ctx);
    const body = await req.json();
    const { providerId, workspaceId, couponCode, tierId, language } = body;

    const result = await modules.payment.initiatePayment({
        tierId: tierId || providerId,
        workspaceId: workspaceId || tierId || providerId,
        couponCode,
        language
    });

    return NextResponse.json(result);
});
