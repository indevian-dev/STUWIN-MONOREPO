// ═══════════════════════════════════════════════════════════════
// GET /api/workspaces/list - Fetch User Workspaces
// ═══════════════════════════════════════════════════════════════
// Returns all workspaces accessible to the authenticated user

import { NextResponse } from 'next/server';
import { unifiedApiHandler } from '@/lib/app-access-control/interceptors';

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

    return NextResponse.json({
      success: true,
      data: workspacesList,
      total: workspacesList.length
    });
  } catch (error) {
    console.error('Error fetching workspaces:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_WORKSPACES_FAILED',
          message: error instanceof Error ? error.message : 'Failed to fetch workspaces',
        },
      },
      { status: 500 }
    );
  }
},
  {
    authRequired: true,
  });
