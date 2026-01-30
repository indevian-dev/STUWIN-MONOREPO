import { withApiHandler } from "@/lib/app-access-control/interceptors";
import { ModuleFactory } from "@/lib/app-core-modules/factory";
import { NextResponse } from "next/server";

export const POST = withApiHandler(
    async (req: any, { ctx, log, params }) => {
        const homeworkId = params.id;
        const modules = new ModuleFactory(ctx);
        const result = await modules.activity.initiateHomeworkSession(homeworkId);

        if (!result.success) {
            return NextResponse.json({ success: false, error: result.error }) as any;
        }

        return NextResponse.json({
            success: true,
            data: result.data,
        }) as any;
    },
    {
        method: "POST",
        authRequired: true,
    },
);
