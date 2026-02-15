
import { unifiedApiHandler } from '@/lib/middleware/handlers';
import { okResponse, serverErrorResponse } from '@/lib/middleware/responses/ApiResponse';

export const GET = unifiedApiHandler(async (_request, { module, log }) => {
    try {
        const result = await module.payment.getAvailableTiers();

        return okResponse(result);
    } catch (error) {
        log.error('Tiers fetch error', error as Error);
        return serverErrorResponse('Internal server error');
    }
});
