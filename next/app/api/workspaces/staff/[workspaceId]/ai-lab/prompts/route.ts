import { NextRequest, NextResponse } from 'next/server';
import { ModuleFactory } from '@/lib/domain/factory';
import { AuthContext } from '@/lib/domain/base/types';

// Helper to construct auth context (Simulated for Staff)
async function getStaffContext(req: NextRequest, workspaceId: string): Promise<AuthContext> {
    // In a real implementation, this would verify the session using headers/cookies
    // and ensure the user has access to the workspace.
    // For now, we assume the middleware or previous layers validated access.
    return {
        userId: 'staff-user-id',
        accountId: 'staff-account-id',
        activeWorkspaceId: workspaceId,
        allowedWorkspaceIds: [workspaceId],
        permissions: ['manage_ai']
    };

}

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ workspaceId: string }> }
) {
    try {
        const { workspaceId } = await params;
        const ctx = await getStaffContext(req, workspaceId);

        const modules = new ModuleFactory(ctx);

        const result = await modules.intelligence.listAllPrompts();
        if (!result.success) {
            return NextResponse.json({ success: false, error: result.error }, { status: 500 });
        }
        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
    }
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ workspaceId: string }> }
) {
    try {
        const { workspaceId } = await params;
        const ctx = await getStaffContext(req, workspaceId);

        const modules = new ModuleFactory(ctx);
        const body = await req.json();

        // Basic validation
        if (!body.title || !body.body || !body.usageFlowType) {
            return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
        }

        const result = await modules.intelligence.createPrompt(body);

        if (!result.success) {
            return NextResponse.json({ success: false, error: (result as any).error }, { status: 500 });
        }


        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
    }
}
