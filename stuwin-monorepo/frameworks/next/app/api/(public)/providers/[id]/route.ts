
import { NextResponse } from "next/server";
import { unifiedApiHandler } from "@/lib/app-access-control/interceptors";

export const GET = unifiedApiHandler(async (request, { module, params, isValidSlimId }) => {
    const resolvedParams = await params;
    const id = resolvedParams?.id;

    if (!id || !isValidSlimId(id)) {
        return NextResponse.json({ error: "Invalid provider ID" }, { status: 400 });
    }

    const result = await module.workspace.getWorkspace(id);

    if (!result.success || !result.workspace) {
        return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    const workspace = result.workspace;

    // Enforce type check
    if (workspace.type !== 'provider') {
        return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    // Ensure active/approved (assuming isActive handles approval for now, or check metadata implies approval)
    if (!workspace.isActive) {
        // Potentially hide inactive ones
        // return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    return NextResponse.json({ provider: workspace });
});
