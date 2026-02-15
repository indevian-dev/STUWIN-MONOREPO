// ═══════════════════════════════════════════════════════════════
// GET /api/workspaces/list - Fetch User Workspaces
// ═══════════════════════════════════════════════════════════════
// Returns all workspaces accessible to the authenticated user

import { unifiedApiHandler } from '@/lib/middleware/handlers';
import { okResponse, serverErrorResponse } from '@/lib/middleware/responses/ApiResponse';

/**
 * GET /api/workspaces/list
 * Fetch all contexts for the authenticated user (ONE QUERY - Fast!)
 */
export const GET = unifiedApiHandler(async (request, { auth, module }) => {
  try {
    // Call Service
    const result = await module.workspace.listUserWorkspaces(auth.accountId);

    // Cast to any to avoid union type issues during strict checking
    const workspaces = (result as any).workspaces;

    if (!result.success || !workspaces) {
      throw new Error(result.error || "Failed to list workspaces");
    }

    // Map to workspace list format
    // Result is Array of { membership, workspace, role } or just [workspaces]
    const workspacesList = workspaces.map((item: any) => {
      // Handle both nested and flat structures
      const ws = item.workspace || item;

      return {
        workspaceId: ws.id,
        workspaceType: ws.type as any,
        title: ws.title,
        description: (ws.metadata as any)?.description || '',
        createdAt: ws.createdAt,
        isActive: ws.isActive,
        routePath: `/${ws.type}`,
        displayIcon: null,
        organizationId: null,
        organizationName: null,
        isPrimary: false,
        sortOrder: 0,
        lastAccessedAt: new Date()
      };
    });

    return okResponse({ workspaces: workspacesList, total: workspacesList.length });
  } catch (error) {
    console.error('Error fetching workspaces:', error);
    return serverErrorResponse(error instanceof Error ? error.message : 'Failed to fetch workspaces');
  }
},
  {
    authRequired: true,
  });
