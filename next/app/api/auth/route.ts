
import { unifiedApiHandler } from "@/lib/middleware/handlers";
import { okResponse, errorResponse, serverErrorResponse } from '@/lib/middleware/responses/ApiResponse';

export const GET = unifiedApiHandler(async (request, { module }) => {
    try {
        const result = await module.auth.getAuthProfile();

        if (!result.success) {
            return errorResponse(result.error, result.status);
        }

        return okResponse(result.data);
    } catch (error) {
        console.error("Error in auth profile route:", error);
        return serverErrorResponse("Server error occurred");
    }
});

export const PATCH = unifiedApiHandler(async (request, { module, authData }) => {
    try {
        if (!authData?.user?.id) {
            return errorResponse("Unauthorized", 401, "UNAUTHORIZED");
        }

        const body = await request.json();
        const { firstName, lastName } = body;

        const result = await module.auth.updateProfile(authData.user.id, { firstName, lastName });

        if (!result.success) {
            return errorResponse(result.error, result.status);
        }

        return okResponse(result.data);
    } catch (error) {
        console.error("Error in auth profile update route:", error);
        return serverErrorResponse("Server error occurred");
    }
});
