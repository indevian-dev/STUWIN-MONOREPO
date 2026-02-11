
import { unifiedApiHandler } from "@/lib/middleware/handlers";
import { NextResponse } from "next/server";

export const GET = unifiedApiHandler(async (request, { module }) => {
    try {
        const result = await module.auth.getAuthProfile();

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: result.status }
            );
        }

        return NextResponse.json(result.data, { status: 200 });
    } catch (error) {
        console.error("Error in auth profile route:", error);
        return NextResponse.json(
            { error: "Server error occurred" },
            { status: 500 }
        );
    }
});

export const PATCH = unifiedApiHandler(async (request, { module, authData }) => {
    try {
        if (!authData?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { firstName, lastName } = body;

        const result = await module.auth.updateProfile(authData.user.id, { firstName, lastName });

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: result.status }
            );
        }

        return NextResponse.json(result.data, { status: 200 });
    } catch (error) {
        console.error("Error in auth profile update route:", error);
        return NextResponse.json(
            { error: "Server error occurred" },
            { status: 500 }
        );
    }
});
