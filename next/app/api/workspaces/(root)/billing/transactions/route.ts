
import { NextResponse } from "next/server";
import { unifiedApiHandler } from "@/lib/middleware/handlers/ApiInterceptor";
import { ModuleFactory } from "@/lib/domain/factory";

export const GET = unifiedApiHandler(async (req, { ctx }) => {
    const modules = new ModuleFactory(ctx);
    return NextResponse.json(await modules.payment.listTransactions());
});
