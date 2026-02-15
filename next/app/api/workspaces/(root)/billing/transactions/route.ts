
import { unifiedApiHandler } from "@/lib/middleware/handlers/ApiInterceptor";
import { okResponse } from '@/lib/middleware/responses/ApiResponse';

export const GET = unifiedApiHandler(async (_req, { module }) => {
    return okResponse(await module.payment.listTransactions());
});
