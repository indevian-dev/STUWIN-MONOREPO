import { withApiHandler } from "@/lib/app-access-control/interceptors";
import { ModuleFactory } from "@/lib/app-core-modules/factory";
import { NextResponse } from "next/server";

export const POST = withApiHandler(
    async (req: any, { ctx, log }) => {
        try {
            const body = await req.json();
            const { quizId } = body;

            if (!quizId) {
                return NextResponse.json({ success: false, error: "quizId is required" }, { status: 400 }) as any;
            }

            const modules = new ModuleFactory(ctx);
            const result = await modules.activity.analyzeQuiz(quizId);

            if (!result.success) {
                return NextResponse.json({ success: false, error: result.error }) as any;
            }

            return NextResponse.json({
                success: true,
                data: result.data,
            }) as any;
        } catch (error) {
            return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 }) as any;
        }
    },
    {
        method: "POST",
        authRequired: true,
    }
);
