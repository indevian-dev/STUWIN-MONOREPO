import { NextRequest, NextResponse } from "next/server";
import { unifiedApiHandler, type UnifiedContext } from "@/lib/middleware/handlers/ApiInterceptor";

export const POST = unifiedApiHandler(
    async (req: NextRequest, { module, params }: UnifiedContext) => {
        const homeworkId = params.id;
        const result = await module.homework.initiateAiSession(homeworkId);

        if (!result.success) {
            return NextResponse.json({ success: false, error: result.error });
        }

        return NextResponse.json({
            success: true,
            data: result.data,
        });
    },
    {
        method: "POST",
        authRequired: true,
    },
);
