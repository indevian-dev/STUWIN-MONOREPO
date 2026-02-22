
import { unifiedApiHandler } from '@/lib/middleware/_Middleware.index';
import { okResponse, serverErrorResponse } from '@/lib/middleware/Response.Api.middleware';

export const GET = unifiedApiHandler(async (_request, { module, log }) => {
    try {
        const result = await module.payment.getAvailableTiers();

        return okResponse(result);
    } catch (error) {
        log.error('Tiers fetch error', error as Error);
        return serverErrorResponse('Internal server error');
    }
});
