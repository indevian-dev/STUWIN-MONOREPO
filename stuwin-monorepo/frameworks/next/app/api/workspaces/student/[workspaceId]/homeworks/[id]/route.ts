import { NextRequest, NextResponse } from "next/server";
import { unifiedApiHandler, type UnifiedContext } from "@/lib/app-access-control/interceptors/ApiInterceptor";

/**
 * GET /api/workspaces/student/[workspaceId]/homeworks/[id]
 * Get individual homework details
 */
export const GET = unifiedApiHandler(
    async (request: NextRequest, { module, auth, log, params }: UnifiedContext) => {
        const homeworkId = params?.id as string;
        if (!homeworkId) {
            return NextResponse.json({ success: false, error: "Homework ID is required" }, { status: 400 });
        }

        const result = await module.activity.getHomeworkDetail(homeworkId);

        if (!result.success) {
            log.error("Failed to get homework detail", { homeworkId, error: result.error });
            return NextResponse.json({ success: false, error: result.error }, { status: 404 });
        }

        // Access control: Ensure the homework belongs to the student
        if (result.data.studentAccountId !== auth.accountId) {
            return NextResponse.json({ success: false, error: "Access denied" }, { status: 403 });
        }

        return NextResponse.json({
            success: true,
            data: result.data,
        });
    },
);
