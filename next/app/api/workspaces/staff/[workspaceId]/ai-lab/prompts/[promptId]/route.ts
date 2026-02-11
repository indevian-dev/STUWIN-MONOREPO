import { NextRequest, NextResponse } from 'next/server';
import { ModuleFactory } from '@/lib/domain/factory';
import { AuthContext } from '@/lib/domain/base/types';

// Helper to construct auth context (Simulated for Staff)
async function getStaffContext(req: NextRequest, workspaceId: string): Promise<AuthContext> {
    return {
        userId: 'staff-user-id',
        accountId: 'staff-account-id',
        activeWorkspaceId: workspaceId,
        allowedWorkspaceIds: [workspaceId],
        permissions: ['manage_ai']
    };

}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ workspaceId: string; promptId: string }> }
) {
    try {
        const { workspaceId, promptId } = await params;
        const ctx = await getStaffContext(req, workspaceId);

        const modules = new ModuleFactory(ctx);
        const body = await req.json();

        // Remove ID from body if present to avoid confusion
        const { id, ...updateData } = body;

        const result = await modules.intelligence.updatePrompt(promptId, updateData);


        if (!result.success) {
            return NextResponse.json({ success: false, error: (result as any).error }, { status: 500 });
        }


        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
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


        if (!result.success) {
            // SystemPromptService.deletePrompt might return 'Not implemented' or similar
            // returning 400 or 500 depending on implementation
            return NextResponse.json({ success: false, error: (result as any).error }, { status: 400 });
        }
        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
    }
}
