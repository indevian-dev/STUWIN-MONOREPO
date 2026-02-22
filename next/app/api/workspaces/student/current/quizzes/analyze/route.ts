import { NextRequest } from 'next/server';
import { unifiedApiHandler, type UnifiedContext } from "@/lib/middleware/Interceptor.Api.middleware";
import { okResponse, errorResponse } from '@/lib/middleware/Response.Api.middleware';

export const POST = unifiedApiHandler(
    async (req: NextRequest, { module, log }: UnifiedContext) => {
        try {
            const body = await req.json();
            const { quizId } = body;

            if (!quizId) {
                return errorResponse("quizId is required", 400);
            }

            const result = await module.quiz.analyze(quizId);

            if (!result.success) {
                return errorResponse(result.error);
            }

            return okResponse(result.data);
        } catch (error) {
            log.error("Quiz analysis error", error);
            return errorResponse("Invalid request", 400);
        }
    },
    {
        method: "POST",
        authRequired: true,
    }
);
