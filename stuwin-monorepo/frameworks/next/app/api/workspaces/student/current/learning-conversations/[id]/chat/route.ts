import { NextRequest, NextResponse } from "next/server";
import { unifiedApiHandler, type UnifiedContext } from "@/lib/app-access-control/interceptors/ApiInterceptor";

/**
 * POST /api/workspaces/student/current/learning-conversations/[id]/chat
 * Send a message to an AI learning session
 */
export const POST = unifiedApiHandler(
    async (req: NextRequest, { module, log, params }: UnifiedContext) => {
        try {
            const sessionId = params.id;
            const body = await req.json();
            const { message } = body;

            if (!message) {
                return NextResponse.json({ success: false, error: "Message is required" }, { status: 400 });
            }

            const result = await module.activity.addMessageToAiSession(sessionId, message);

            if (!result.success) {
                return NextResponse.json({ success: false, error: result.error });
            }

            return NextResponse.json({
                success: true,
                data: result.data,
            });
        } catch (error) {
            log.error("Learning conversation chat error", error);
            return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
        }
    },
    {
        method: "POST",
        authRequired: true,
    },
);
