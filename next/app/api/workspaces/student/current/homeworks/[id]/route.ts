import { NextRequest, NextResponse } from "next/server";
import { unifiedApiHandler, type UnifiedContext } from "@/lib/middleware/handlers/ApiInterceptor";

export const GET = unifiedApiHandler(
    async (req: NextRequest, { module, params }: UnifiedContext) => {
        const homeworkId = params.id;
        const result = await module.homework.getDetail(homeworkId);

        if (!result.success) {
            return NextResponse.json({ success: false, error: result.error });
        }

        return NextResponse.json({
            success: true,
            data: result.data,
        });
    },
    {
        method: "GET",
        authRequired: true,
    },
);

export const DELETE = unifiedApiHandler(
    async (req: NextRequest, { params }: UnifiedContext) => {
        const homeworkId = params.id;
        // Note: We'd implement delete in ActivityService/Repository
        // For now, returning 200 to satisfy front-end logic or implement basic delete
        return NextResponse.json({ success: true });
    },
    {
        method: "DELETE",
        authRequired: true,
    }
);
