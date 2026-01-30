import { withApiHandler } from "@/lib/app-access-control/interceptors";
import { ModuleFactory } from "@/lib/app-core-modules/factory";
import { NextResponse } from "next/server";

/**
 * POST /api/workspaces/student/[workspaceId]/homeworks/[id]/initiate
 * Initiate or resume an AI Socratic learning session for homework
 */
export const POST = withApiHandler(
    async (req: any, { ctx, log, params }) => {
        const homeworkId = params.id;
        if (!homeworkId) {
            return NextResponse.json({ success: false, error: "Homework ID is required" }, { status: 400 }) as any;
        }

        const modules = new ModuleFactory(ctx);
        const result = await modules.activity.initiateHomeworkSession(homeworkId);

        if (!result.success) {
            log.error("Failed to initiate homework session", { homeworkId, error: result.error });
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
