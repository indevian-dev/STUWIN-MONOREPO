import { withApiHandler } from "@/lib/app-access-control/interceptors";
import { ModuleFactory } from "@/lib/app-core-modules/factory";
import { NextResponse } from "next/server";

/**
 * POST /api/workspaces/student/current/learning-conversations/[id]/chat
 * Send a message to an AI learning session
 */
export const POST = withApiHandler(
    async (req: any, { ctx, log, params }) => {
        try {
            const sessionId = params.id;
            const body = await req.json();
            const { message } = body;

            if (!message) {
                return NextResponse.json({ success: false, error: "Message is required" }, { status: 400 }) as any;
            }

            const modules = new ModuleFactory(ctx);
            const result = await modules.activity.addMessageToSession(sessionId, message);

            if (!result.success) {
                return NextResponse.json({ success: false, error: result.error }) as any;
            }

            return NextResponse.json({
                success: true,
                data: result.data,
            }) as any;
        } catch (error) {
            log.error("Learning conversation chat error", error);
            return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 }) as any;
        }
    },
    {
        method: "POST",
        authRequired: true,
    },
);
