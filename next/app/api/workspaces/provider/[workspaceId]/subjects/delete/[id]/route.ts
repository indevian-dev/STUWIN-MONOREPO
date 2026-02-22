
import { unifiedApiHandler } from "@/lib/middleware/_Middleware.index";
import { okResponse, errorResponse, serverErrorResponse } from '@/lib/middleware/Response.Api.middleware';

export const DELETE = unifiedApiHandler(async (request, { module, params, log }) => {
    const { id, workspaceId } = await params;

    if (!id) {
        return errorResponse("Invalid subject ID", 400);
    }

    try {
        const result = await module.subject.delete(id, workspaceId as string);

        if (!result.success) {
            return errorResponse(result.error || "Failed to delete subject", 404);
        }

        log.info("Subject deleted successfully", { subjectId: id, workspaceId });
        return okResponse(result.data, "Subject deleted successfully");
    } catch (error) {
        log.error("Failed to delete subject", error);
        return serverErrorResponse(error instanceof Error ? error.message : "Failed to delete subject");
    }
});
