import { unifiedApiHandler } from "@/lib/app-access-control/interceptors";
import { NextResponse } from "next/server";

/**
 * GET /api/workspaces/onboarding/search-child?fin=...
 * Search for student workspaces by child FIN
 */
export const GET = unifiedApiHandler(
    async (req: any, { auth, module, log }) => {
        const fin = req.nextUrl.searchParams.get("fin");

        if (!fin) {
            return NextResponse.json({ success: false, error: "FIN is required" }, { status: 400 }) as any;
        }

        const result = await module.workspace.findChildWorkspaces(fin);

        return NextResponse.json(result) as any;
    },
    {
        method: "GET",
        authRequired: true,
    }
);
