
import { unifiedApiHandler } from "@/lib/middleware/handlers/ApiInterceptor";
import { okResponse, errorResponse, serverErrorResponse } from '@/lib/middleware/responses/ApiResponse';

export const POST = unifiedApiHandler(async (_req, { module, params }) => {
    const transactionId = params?.transactionId;

    if (!transactionId) {
        return errorResponse("Transaction ID missing", 400);
    }

    try {
        const result = await module.payment.checkPaymentStatus(transactionId);
        return okResponse(result);
    } catch (error: unknown) {
        return serverErrorResponse((error as Error).message);
    }
});
