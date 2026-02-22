import { unifiedApiHandler } from "@/lib/middleware/Interceptor.Api.middleware";
import { okResponse } from '@/lib/middleware/Response.Api.middleware';

export const GET = unifiedApiHandler(async (_req, { module, auth }) => {
    return okResponse(await module.workspace.listEnrolledProviders(auth.userId));
});
