import { unifiedApiHandler } from '@/lib/middleware/handlers';
import { okResponse, errorResponse } from '@/lib/middleware/responses/ApiResponse';

/**
 * Unified Verification API Endpoint
 * Consolidates email and phone verification logic
 */

/**
 * GET Handler - Generate OTP
 * Query Params:
 * - type: 'email' | 'phone'
 * - target: email address or phone number
 */
export const GET = unifiedApiHandler(async (req, { module, authData }) => {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') as 'email' | 'phone';
    const target = searchParams.get('target');

    if (!type || !['email', 'phone'].includes(type)) {
        return errorResponse('Valid verification type (email or phone) is required', 400);
    }

    if (!target) {
        return errorResponse(`${type === 'email' ? 'Email' : 'Phone number'} is required`, 400);
    }

    if (!authData) {
        return errorResponse('Unauthorized', 401, "UNAUTHORIZED");
    }

    const result = await module.verification.generateOtp({
        type,
        target,
        accountId: authData.account.id.toString()
    });

    if (!result.success) {
        return errorResponse(result.error, result.status);
    }

    return okResponse(result.data);
});

/**
 * POST Handler - Validate OTP
 * Body:
 * - type: 'email' | 'phone'
 * - target: email address or phone number
 * - otp: 6-digit code
 */
export const POST = unifiedApiHandler(async (req, { module, authData }) => {
    try {
        const body = await req.json().catch(() => ({}));
        const { type, target, otp } = body;

        if (!type || !['email', 'phone'].includes(type)) {
            return errorResponse('Valid verification type (email or phone) is required', 400);
        }

        if (!target || !otp) {
            return errorResponse('Target and OTP are required', 400);
        }

        if (!authData) {
            return errorResponse('Unauthorized', 401, "UNAUTHORIZED");
        }

        const result = await module.verification.validateOtp({
            type,
            target,
            otp,
            accountId: authData.account.id.toString(),
            userId: authData.user.id
        });

        if (!result.success) {
            return errorResponse(result.error, result.status);
        }

        return okResponse(result.data);
    } catch (error) {
        return errorResponse('Invalid request body', 400);
    }
});
