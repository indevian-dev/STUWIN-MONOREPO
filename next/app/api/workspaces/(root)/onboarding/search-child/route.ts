import { unifiedApiHandler } from "@/lib/middleware/handlers";
import { okResponse, errorResponse } from '@/lib/middleware/responses/ApiResponse';

/**
 * GET /api/workspaces/onboarding/search-child?fin=...
 * Search for student workspaces by child FIN
 */
export const GET = unifiedApiHandler(
    async (req: any, { auth, module, log }) => {
        const fin = req.nextUrl.searchParams.get("fin");

        if (!fin) {
            return errorResponse("FIN is required", 400) as any;
        }

        const result = await module.workspace.findChildWorkspaces(fin);

        return okResponse(result) as any;
    },
    {
        method: "GET",
        authRequired: true,
    }
);
