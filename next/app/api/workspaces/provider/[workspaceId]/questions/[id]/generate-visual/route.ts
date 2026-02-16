import { unifiedApiHandler } from "@/lib/middleware/handlers";
import { VisualGenerationService } from "@/lib/domain/question/visual-generation.service";
import type { VisualGenerationInput } from "@/lib/domain/question/visual.types";
import { okResponse, errorResponse } from '@/lib/middleware/responses/ApiResponse';

export const POST = unifiedApiHandler(async (request, { module, params }) => {
    const questionId = params?.id;

    if (!questionId) {
        return errorResponse("Missing question id", 400);
    }

    // Verify question exists
    const questionResult = await module.question.getById(questionId as string);
    if (!questionResult.success || !questionResult.data) {
        return errorResponse("Question not found", 404, "NOT_FOUND");
    }

    const body = await request.json() as VisualGenerationInput;

    if (!body.mode || !["3d", "2d"].includes(body.mode)) {
        return errorResponse("Invalid mode. Use '3d' or '2d'", 400);
    }

    const question = questionResult.data;

    const input: VisualGenerationInput = {
        mode: body.mode,
        questionText: body.questionText || String(question.question || ""),
        subjectName: body.subjectName,
        topicName: body.topicName,
        language: body.language,
        guidance: body.guidance,
    };

    // Generate 3 realistic variants in parallel
    const variants = await VisualGenerationService.generateVisualVariants(input);

    return okResponse({ variants });
});
