import { unifiedApiHandler } from "@/lib/app-access-control/interceptors";
import { NextResponse } from "next/server";

/**
 * POST /api/workspaces/onboarding
 * Handle Parent or Provider onboarding submission
 */
export const POST = unifiedApiHandler(
    async (req: any, { auth, module, log }) => {
        try {
            const body = await req.json();
            const { type, data } = body;

            if (type === "parent") {
                const { studentWorkspaceIds } = data;
                if (!studentWorkspaceIds || !studentWorkspaceIds.length) {
                    return NextResponse.json({ success: false, error: "Selection is required" }, { status: 400 }) as any;
                }
                const result = await module.workspace.startParentWorkspaceFlow(auth.accountId, studentWorkspaceIds);
                return NextResponse.json(result) as any;
            }

            if (type === "provider") {
                const { title, orgDetails } = data;
                if (!title) {
                    return NextResponse.json({ success: false, error: "Organization title is required" }, { status: 400 }) as any;
                }
                const result = await module.workspace.submitProviderApplication(auth.accountId, {
                    title,
                    metadata: orgDetails || {},
                });
                return NextResponse.json(result) as any;
            }

            if (type === "student") {
                const { displayName, metadata, providerId } = data;
                if (!displayName || !providerId) {
                    return NextResponse.json({ success: false, error: "Display name and Provider are required" }, { status: 400 }) as any;
                }
                const result = await module.workspace.createStudentWorkspace(auth.accountId, {
                    displayName,
                    gradeLevel: metadata?.gradeLevel,
                    providerId
                });
                return NextResponse.json(result) as any;
            }

            if (type === "tutor") {
                const { title, metadata } = data;
                if (!title) {
                    return NextResponse.json({ success: false, error: "Title is required" }, { status: 400 }) as any;
                }
                // Tutor workspaces created as 'tutor' type, potentially requiring approval if isActive=false
                const result = await module.workspace.submitProviderApplication(auth.accountId, {
                    title,
                    metadata: metadata || {},
                }, "tutor");
                return NextResponse.json(result) as any;
            }

            return NextResponse.json({ success: false, error: "Invalid onboarding type" }, { status: 400 }) as any;
        } catch (error) {
            log.error("Onboarding POST error", error);
            return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 }) as any;
        }
    },
    {
        method: "POST",
        authRequired: true,
    }
);
