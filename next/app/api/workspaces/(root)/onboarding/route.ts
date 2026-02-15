import { unifiedApiHandler } from "@/lib/middleware/handlers";
import { okResponse, errorResponse } from '@/lib/middleware/responses/ApiResponse';

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
                    return errorResponse("Selection is required", 400) as any;
                }
                const result = await module.workspace.startParentWorkspaceFlow(auth.accountId, studentWorkspaceIds);
                return okResponse(result) as any;
            }

            if (type === "provider") {
                const { title, orgDetails } = data;
                if (!title) {
                    return errorResponse("Organization title is required", 400) as any;
                }
                const result = await module.workspace.submitProviderApplication(auth.accountId, {
                    title,
                    metadata: orgDetails || {},
                });
                return okResponse(result) as any;
            }

            if (type === "student") {
                const { displayName, metadata, providerId } = data;
                if (!displayName || !providerId) {
                    return errorResponse("Display name and Provider are required", 400) as any;
                }
                const result = await module.workspace.createStudentWorkspace(auth.accountId, {
                    displayName,
                    gradeLevel: metadata?.gradeLevel,
                    providerId
                });
                return okResponse(result) as any;
            }

            if (type === "tutor") {
                const { title, metadata } = data;
                if (!title) {
                    return errorResponse("Title is required", 400) as any;
                }
                // Tutor workspaces created as 'tutor' type, potentially requiring approval if isActive=false
                const result = await module.workspace.submitProviderApplication(auth.accountId, {
                    title,
                    metadata: metadata || {},
                }, "tutor");
                return okResponse(result) as any;
            }

            return errorResponse("Invalid onboarding type", 400) as any;
        } catch (error) {
            log.error("Onboarding POST error", error);
            return errorResponse("Invalid request", 400) as any;
        }
    },
    {
        method: "POST",
        authRequired: true,
    }
);
