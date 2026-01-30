
import { unifiedApiHandler } from "@/lib/app-access-control/interceptors";
import { NextResponse } from "next/server";

/**
 * GET - Returns a presigned URL for avatar upload
 */
export const GET = unifiedApiHandler(async (request, { module, authData }) => {
    try {
        if (!authData?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const result = await module.auth.getAvatarUploadUrl(authData.user.id);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: result.status }
            );
        }

        return NextResponse.json(result.data, { status: 200 });
    } catch (error) {
        console.error("Error in avatar presign route:", error);
        return NextResponse.json(
            { error: "Server error occurred" },
            { status: 500 }
        );
    }
});
