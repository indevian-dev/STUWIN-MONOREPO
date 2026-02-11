import { NextRequest, NextResponse } from "next/server";
import { unifiedApiHandler, type UnifiedContext } from "@/lib/middleware/handlers/ApiInterceptor";

export const POST = unifiedApiHandler(
    async (req: NextRequest, { module, log }: UnifiedContext) => {
        try {
            const body = await req.json();
            const { quizId } = body;

            if (!quizId) {
                return NextResponse.json({ success: false, error: "quizId is required" }, { status: 400 });
            }

            const result = await module.quiz.analyze(quizId);

            if (!result.success) {
                return NextResponse.json({ success: false, error: result.error });
            }

            return NextResponse.json({
                success: true,
                data: result.data,
            });
        } catch (error) {
            log.error("Quiz analysis error", error);
            return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
        }
    },
    {
        method: "POST",
        authRequired: true,
    }
);
