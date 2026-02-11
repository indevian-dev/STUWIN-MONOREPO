import { NextRequest, NextResponse } from "next/server";
import { unifiedApiHandler, type UnifiedContext } from "@/lib/middleware/handlers/ApiInterceptor";

/**
 * POST /api/workspaces/student/[workspaceId]/homeworks/[id]/initiate
 * Initiate or resume an AI Socratic learning session for homework
 */
export const POST = unifiedApiHandler(
    async (request: NextRequest, { module, auth, log, params }: UnifiedContext) => {
        const homeworkId = params?.id as string;
        if (!homeworkId) {
            return NextResponse.json({ success: false, error: "Homework ID is required" }, { status: 400 });
        }

        const result = await module.homework.initiateAiSession(homeworkId);

        if (!result.success) {
            log.error("Failed to initiate homework session", { homeworkId, error: result.error });
            return NextResponse.json({ success: false, error: result.error }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            data: result.data,
        });
    },
);
