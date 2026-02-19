import { NextRequest } from 'next/server';
import { unifiedApiHandler, type UnifiedContext } from "@/lib/middleware/handlers/ApiInterceptor";
import { okResponse, errorResponse, serverErrorResponse } from '@/lib/middleware/responses/ApiResponse';

/**
 * GET /api/workspaces/student/:workspaceId/subjects
 * Returns subjects from the student's linked provider workspace.
 */
export const GET = unifiedApiHandler(
    async (request: NextRequest, { module, params }: UnifiedContext) => {
        const workspaceId = params?.workspaceId as string;

        // Get linked provider workspace via the student's access record
        const connections = await module.workspace.repository.listConnections(workspaceId);
        const providerConnection = connections.find(
            c => c.connection.targetWorkspaceId !== workspaceId && c.workspace.type === 'provider'
        );

        if (!providerConnection) {
            return errorResponse("No linked provider workspace found", 404);
        }

        const result = await module.subject.getWorkspaceSubjects(providerConnection.workspace.id);

        if (!result.success || !result.data) {
            return serverErrorResponse(result.error || "Failed to fetch subjects");
        }

        return okResponse(result.data);
    }
);
