
import { unifiedApiHandler } from "@/lib/middleware/_Middleware.index";
import { okResponse, errorResponse, serverErrorResponse } from '@/lib/middleware/Response.Api.middleware';

export const POST = unifiedApiHandler(async (request, { module, authData }) => {
    try {
        if (!authData?.user?.id || !authData?.account?.id) {
            return errorResponse("Unauthorized", 401, "UNAUTHORIZED");
        }

        const body = await request.json();
        const type = body.method || body.type || 'email';

        // Fetch phone from DB when needed (not stored in session data)
        let phone: string | undefined;
        if (type === 'phone') {
            const userDetails = await module.auth.getUserDetails(authData.user.id);
            phone = userDetails.data?.user?.phone ?? undefined;
            if (!phone) {
                return errorResponse("No phone number on file", 400, "PHONE_MISSING");
            }
        }

        const result = await module.auth.requestVerificationCode({
            email: type === 'email' ? authData.user.email : undefined,
            phone,
            operation: '2fa',
        });

        if (!result.success) {
            return errorResponse(result.error, result.status);
        }

        return okResponse(result.data);
    } catch (error) {
        console.error("Error in 2FA generate route:", error);
        return serverErrorResponse("Server error occurred");
    }
});
