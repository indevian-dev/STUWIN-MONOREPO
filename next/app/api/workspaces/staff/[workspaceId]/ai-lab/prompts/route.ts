import { NextRequest } from 'next/server';
import { okResponse, errorResponse, serverErrorResponse } from '@/lib/middleware/responses/ApiResponse';
import { ModuleFactory } from '@/lib/domain/factory';
import { AuthContext } from '@/lib/domain/base/types';

// Helper to construct auth context (Simulated for Staff)
async function getStaffContext(_req: NextRequest, workspaceId: string): Promise<AuthContext> {
    return {
        userId: 'staff-user-id',
        accountId: 'staff-account-id',
        activeWorkspaceId: workspaceId,
        permissions: ['manage_ai']
    };
}

interface CreatePromptInput {
    title: string;
    body: string;
    usageFlowType: string;
    isActive?: boolean;
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
        return okResponse(result);
    } catch (error) {
        return serverErrorResponse((error as Error).message);
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
        const body = await req.json() as CreatePromptInput;

        // Basic validation
        if (!body.title || !body.body || !body.usageFlowType) {
            return errorResponse("Missing required fields", 400);
        }

        const result = await modules.intelligence.createPrompt({
            title: body.title,
            body: body.body,
            usageFlowType: body.usageFlowType,
            isActive: body.isActive,
        });

        return okResponse(result);
    } catch (error) {
        return serverErrorResponse((error as Error).message);
    }
}
