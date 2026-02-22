import { NextRequest } from 'next/server';
import { okResponse, serverErrorResponse } from '@/lib/middleware/Response.Api.middleware';
import { ModuleFactory } from '@/lib/domain/Domain.factory';
import { AuthContext } from '@/lib/domain/base/Base.types';

// Helper to construct auth context (Simulated for Staff)
async function getStaffContext(_req: NextRequest, workspaceId: string): Promise<AuthContext> {
    return {
        userId: 'staff-user-id',
        accountId: 'staff-account-id',
        activeWorkspaceId: workspaceId,
        permissions: ['manage_ai']
    };
}

interface UpdatePromptInput {
    title?: string;
    body?: string;
    isActive?: boolean;
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ workspaceId: string; promptId: string }> }
) {
    try {
        const { workspaceId, promptId } = await params;
        const ctx = await getStaffContext(req, workspaceId);

        const modules = new ModuleFactory(ctx);
        const body = await req.json() as UpdatePromptInput;

        const result = await modules.intelligence.updatePrompt(promptId, {
            title: body.title,
            body: body.body,
            isActive: body.isActive,
        });

        return okResponse(result);
    } catch (error) {
        return serverErrorResponse((error as Error).message);
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ workspaceId: string; promptId: string }> }
) {
    try {
        const { workspaceId, promptId } = await params;
        const ctx = await getStaffContext(req, workspaceId);

        const modules = new ModuleFactory(ctx);

        const result = await modules.intelligence.deletePrompt(promptId);
        return okResponse(result);
    } catch (error) {
        return serverErrorResponse((error as Error).message);
    }
}
