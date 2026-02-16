import { NextRequest } from 'next/server';
import { unifiedApiHandler } from '@/lib/middleware/handlers';
import { okResponse, errorResponse, serverErrorResponse } from '@/lib/middleware/responses/ApiResponse';

export const GET = unifiedApiHandler(async (_request: NextRequest, { module, params }) => {
    try {
        const workspaceId = params.workspaceId;
        if (!workspaceId) {
            return errorResponse('Workspace ID is required', 400);
        }

        const result = await module.workspace.getWorkspace(workspaceId);

        if (!result.success || !result.workspace) {
            return errorResponse('Workspace not found', 404);
        }

        const ws = result.workspace;
        const profile = (ws.profile || {}) as Record<string, unknown>;

        return okResponse({
            id: ws.id,
            title: ws.title,
            tenantType: ws.type,
            description: profile.providerProgramDescription ?? undefined,
            email: profile.email ?? undefined,
            phone: profile.phone ?? undefined,
            website: profile.website ?? undefined,
            logo: profile.logo ?? undefined,
            location: profile.location ?? { city: undefined, address: undefined },
            isActive: ws.isActive,
            isApproved: profile.isApproved ?? false,
            metadata: {
                currency: profile.currency,
                features: profile.features,
                yearlyPrice: profile.yearlyPrice,
                monthlyPrice: profile.monthlyPrice,
                providerTrialDaysCount: profile.providerTrialDaysCount,
                providerSubscriptionPrice: profile.providerSubscriptionPrice,
                providerSubscriptionPeriod: profile.providerSubscriptionPeriod,
                providerProgramDescription: profile.providerProgramDescription,
            },
            createdAt: ws.createdAt,
            updatedAt: ws.updatedAt,
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch organization';
        return serverErrorResponse(errorMessage);
    }
});
