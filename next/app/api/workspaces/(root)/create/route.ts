// ═══════════════════════════════════════════════════════════════
// POST /api/workspaces/create - Create New Identity/Organization
// ═══════════════════════════════════════════════════════════════
// Creates a new identity (student/teacher) or organization access for the authenticated user

import { NextResponse } from 'next/server';
import { unifiedApiHandler } from '@/lib/middleware/handlers';
import { generateSlimId } from '@/lib/utils/ids/SlimUlidUtil';
import type { CreateWorkspaceRequest } from '@/lib/domain/workspace/workspace.types';

/**
 * POST /api/workspaces/create
 * Create a new identity (student/teacher) or organization for the authenticated user
 */
export const POST = unifiedApiHandler(async (request, { auth, module }) => {
  try {
    const body = await request.json();
    const { workspaceType, title, description } = body as CreateWorkspaceRequest;

    // Validate input
    const typeStr = workspaceType as string;
    if (!typeStr || !['student', 'teacher', 'organization', 'provider', 'eduorg'].includes(typeStr)) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'INVALID_TYPE', message: 'Invalid type. Use: student, teacher, or organization' },
        },
        { status: 400 }
      );
    }

    if (!title || title.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'INVALID_TITLE', message: 'Title is required' },
        },
        { status: 400 }
      );
    }

    // Map legacy types to new types
    let type = typeStr;
    if (typeStr === 'teacher') type = 'provider';
    if (typeStr === 'organization') type = 'provider';

    // Call Service
    const result = await module.workspace.createWorkspace(auth.accountId, {
      title,
      type,
      metadata: { description }
    });

    if (!result.success || !(result as any).workspace) {
      throw new Error((result as any).error);
    }

    const ws = (result as any).workspace;

    // Map to legacy response format
    const createdWorkspace = {
      workspaceId: ws.id,
      workspaceType: ws.type as any,
      title: ws.title,
      description: (ws.metadata as any)?.description || '',
      createdAt: ws.createdAt?.toISOString(),
      isActive: ws.isActive,
    };

    return NextResponse.json({
      success: true,
      data: createdWorkspace,
    });
  } catch (error) {
    console.error('Error creating workspace:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'CREATE_WORKSPACE_FAILED',
          message: error instanceof Error ? error.message : 'Failed to create workspace',
        },
      },
      { status: 500 }
    );
  }
});


