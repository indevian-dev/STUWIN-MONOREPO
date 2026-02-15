
import { unifiedApiHandler } from "@/lib/middleware/handlers/ApiInterceptor";
import { okResponse } from '@/lib/middleware/responses/ApiResponse';

export const POST = unifiedApiHandler(async (req, { module }) => {
    const body = await req.json();
    const { providerId, workspaceId, couponCode, tierId, language } = body;

    const result = await module.payment.initiatePayment({
        tierId: tierId || providerId,
        workspaceId: workspaceId || tierId || providerId,
        couponCode,
        language
    });

    return okResponse(result);
});
