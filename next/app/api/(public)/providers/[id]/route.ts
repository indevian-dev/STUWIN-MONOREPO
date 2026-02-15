
import { unifiedApiHandler } from "@/lib/middleware/handlers";
import { okResponse, errorResponse } from '@/lib/middleware/responses/ApiResponse';

export const GET = unifiedApiHandler(async (request, { module, params, isValidSlimId }) => {
    const resolvedParams = await params;
    const id = resolvedParams?.id;

    if (!id || !isValidSlimId(id)) {
        return errorResponse("Invalid provider ID", 400);
    }

    const result = await module.workspace.getWorkspace(id);

    if (!result.success || !result.workspace) {
        return errorResponse("Provider not found", 404, "NOT_FOUND");
    }

    const workspace = result.workspace;

    // Enforce type check
    if (workspace.type !== 'provider') {
        return errorResponse("Provider not found", 404, "NOT_FOUND");
    }

    // Ensure active/approved (assuming isActive handles approval for now, or check metadata implies approval)
    if (!workspace.isActive) {
        // Potentially hide inactive ones
        // return errorResponse("Provider not found", 404, "NOT_FOUND");
    }

    return okResponse(workspace);
});
