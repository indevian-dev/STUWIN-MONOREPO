
import { unifiedApiHandler } from "@/lib/middleware/Interceptor.Api.middleware";
import { okResponse } from '@/lib/middleware/Response.Api.middleware';

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
