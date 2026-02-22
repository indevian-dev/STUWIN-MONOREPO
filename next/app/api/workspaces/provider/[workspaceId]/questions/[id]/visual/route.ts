import { unifiedApiHandler } from "@/lib/middleware/_Middleware.index";
import { okResponse, errorResponse } from '@/lib/middleware/Response.Api.middleware';

export const GET = unifiedApiHandler(async (_request, { module, params }) => {
    const questionId = params?.id;

    if (!questionId) {
        return errorResponse("Missing question id", 400);
    }

    const result = await module.question.getVisualData(questionId as string);

    if (!result.success) {
        return errorResponse(result.error, 404);
    }

    return okResponse(result.data);
});

export const PUT = unifiedApiHandler(async (request, { module, params }) => {
    const questionId = params?.id;

    if (!questionId) {
        return errorResponse("Missing question id", 400);
    }

    const body = await request.json();

    if (!body.visualData) {
        return errorResponse("Missing visualData", 400);
    }

    const result = await module.question.saveVisualData(
        questionId as string,
        body.visualData,
    );

    if (!result.success) {
        return errorResponse(result.error, 400);
    }

    return okResponse(result.data);
});
