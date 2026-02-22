import { NextRequest } from 'next/server';
import { unifiedApiHandler } from '@/lib/middleware/_Middleware.index';

import { okResponse, errorResponse, serverErrorResponse, messageResponse } from '@/lib/middleware/Response.Api.middleware';
export const GET = unifiedApiHandler(async (request: NextRequest, { module, params }) => {
    const providerId = (await params).providerId as string;

    if (!providerId) {
        return errorResponse("Provider ID is required");
    }

    try {
        const result = await module.workspace.getWorkspace(providerId);

        if (!result) {
            return errorResponse("Provider not found", 404, "NOT_FOUND");
        }

        return okResponse(result);
    } catch (error) {
        const msg = error instanceof Error ? error.message : 'Failed to fetch provider';
        return serverErrorResponse(msg);
    }
});

export const PATCH = unifiedApiHandler(async (request: NextRequest, { module, params }) => {
    const providerId = (await params).providerId as string;
    const body = await request.json();

    if (!providerId) {
        return errorResponse("Provider ID is required");
    }

    try {
        const result = await module.workspace.staffUpdateProvider(providerId, body);

        if (!result.success) {
            return serverErrorResponse(result.error);
        }

        return okResponse(result);
    } catch (error) {
        const msg = error instanceof Error ? error.message : 'Failed to update provider';
        return serverErrorResponse(msg);
    }
});

export const DELETE = unifiedApiHandler(async (request: NextRequest, { module, params }) => {
    const providerId = (await params).providerId as string;

    if (!providerId) {
        return errorResponse("Provider ID is required");
    }

    try {
        const result = await module.workspace.staffDeleteProvider(providerId);

        if (!result.success) {
            return serverErrorResponse(result.error);
        }

        return messageResponse("Success");
    } catch (error) {
        const msg = error instanceof Error ? error.message : 'Failed to delete provider';
        return serverErrorResponse(msg);
    }
});
