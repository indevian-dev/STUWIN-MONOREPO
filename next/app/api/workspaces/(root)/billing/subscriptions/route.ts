import { unifiedApiHandler } from "@/lib/middleware/handlers/ApiInterceptor";
import { okResponse } from '@/lib/middleware/responses/ApiResponse';

export const GET = unifiedApiHandler(async (_req, { module, auth }) => {
    return okResponse(await module.workspace.listEnrolledProviders(auth.userId));
});
