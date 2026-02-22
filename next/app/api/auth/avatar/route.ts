
import { unifiedApiHandler } from "@/lib/middleware/_Middleware.index";
import { okResponse, errorResponse, serverErrorResponse } from '@/lib/middleware/Response.Api.middleware';

/**
 * GET - Returns a presigned URL for avatar upload
 */
export const GET = unifiedApiHandler(async (request, { module, authData }) => {
    try {
        if (!authData?.user?.id) {
            return errorResponse("Unauthorized", 401, "UNAUTHORIZED");
        }

        const { searchParams } = new URL(request.url);
        const fileName = searchParams.get("fileName") || "avatar.webp";
        const contentType = searchParams.get("contentType") || "image/webp";

        const result = await module.auth.getAvatarUploadUrl(authData.user.id, contentType, fileName);

        if (!result.success) {
            return errorResponse(result.error, result.status);
        }

        return okResponse(result.data);
    } catch (error) {
        console.error("Error in avatar presign route:", error);
        return serverErrorResponse("Server error occurred");
    }
});
