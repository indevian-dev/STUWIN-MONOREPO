import { NextRequest } from 'next/server';
import { unifiedApiHandler } from '@/lib/middleware/handlers';
import { okResponse, errorResponse, serverErrorResponse } from '@/lib/middleware/responses/ApiResponse';
import type { WorkspaceProfile } from '@/lib/database/schema';

export const PUT = unifiedApiHandler(async (request: NextRequest, { module, params }) => {
    try {
        const workspaceId = params.workspaceId;
        if (!workspaceId) {
            return errorResponse('Workspace ID is required', 400);
        }

        const body = await request.json();
        const { title, profile } = body;

        // Fetch current workspace to merge profile
        const current = await module.workspace.getWorkspace(workspaceId);
        if (!current.success || !current.workspace) {
            return errorResponse('Workspace not found', 404);
        }

        // Build update data
        const updateData: Record<string, unknown> = {};

        if (title && typeof title === 'string') {
            updateData.title = title.trim();
        }

        if (profile && typeof profile === 'object') {
            // Merge with existing profile to avoid losing fields
            const existingProfile = (current.workspace.profile || {}) as Record<string, unknown>;
            const mergedProfile: WorkspaceProfile = {
                ...existingProfile,
                ...profile,
                type: 'provider', // Always enforce the type
            } as WorkspaceProfile;
            updateData.profile = mergedProfile;
        }

        if (Object.keys(updateData).length === 0) {
            return errorResponse('No valid fields to update', 400);
        }

        const updated = await module.workspace.repository.update(workspaceId, updateData);

        return okResponse({
            id: updated.id,
            title: updated.title,
            profile: updated.profile || {},
            updatedAt: updated.updatedAt,
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update organization';
        return serverErrorResponse(errorMessage);
    }
});
