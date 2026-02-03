import { NextResponse } from "next/server";
import { unifiedApiHandler } from "@/lib/app-access-control/interceptors/ApiInterceptor";
import { ModuleFactory } from "@/lib/app-core-modules/factory";

export const GET = unifiedApiHandler(async (req, { ctx }) => {
    const modules = new ModuleFactory(ctx);
    return NextResponse.json(await modules.payment.getAvailableTiers());
});
