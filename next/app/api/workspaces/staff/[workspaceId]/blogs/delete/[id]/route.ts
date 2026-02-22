import { NextRequest } from 'next/server';
import { errorResponse, serverErrorResponse, messageResponse } from '@/lib/middleware/Response.Api.middleware';
import { unifiedApiHandler } from "@/lib/middleware/_Middleware.index";

export const DELETE = unifiedApiHandler(async (request: NextRequest, { params, authData, module, log }) => {
    if (!params) {
        return errorResponse("Missing parameters");
    }
    const { id } = await params;
    if (!id) {
        return errorResponse("Invalid blog ID");
    }

    try {
        if (!authData) {
            return errorResponse("Unauthorized", 401, "UNAUTHORIZED");
        }

        const deletedBlog = await module.content.contentRepo.deleteBlog(id);

        if (!deletedBlog) {
            return errorResponse("Blog not found", 404, "NOT_FOUND");
        }
        return messageResponse("Blog deleted successfully");
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete blog';
        if (log) log.error("Failed to delete blog", error);
        return serverErrorResponse(errorMessage);
    }
});
