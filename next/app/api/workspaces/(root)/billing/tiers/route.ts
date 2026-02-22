import { unifiedApiHandler } from "@/lib/middleware/Interceptor.Api.middleware";
import { okResponse } from '@/lib/middleware/Response.Api.middleware';

export const GET = unifiedApiHandler(async (_req, { module }) => {
    return okResponse(await module.payment.getAvailableTiers());
});
