import { unifiedApiHandler } from '@/lib/middleware/handlers';
import { okResponse, errorResponse } from '@/lib/middleware/responses/ApiResponse';
import type { UnifiedContext } from '@/lib/middleware/handlers/ApiInterceptor';

/**
 * Unified Verification API Endpoint
 * 
 * Supports fallback auth: if session cookie is missing/broken (common right after registration),
 * falls back to looking up the account by email/phone from the `target` parameter.
 */

/** Resolves accountId + userId from session, falling back to email/phone DB lookup */
async function resolveAccount(
    ctx: Pick<UnifiedContext, 'authData' | 'module'>,
    target: string,
    type: 'email' | 'phone'
): Promise<{ accountId: string; userId: string } | null> {
    const { authData, module } = ctx;

    // 1. Try session-based auth
    const sessionAccountId = authData?.account?.id?.toString();
    const sessionUserId = authData?.user?.id?.toString();

    if (sessionAccountId && sessionAccountId !== '0' && sessionUserId && sessionUserId !== 'guest') {
        return { accountId: sessionAccountId, userId: sessionUserId };
    }

    // 2. Fallback: look up account by email/phone
    return module.verification.resolveAccountByContact(target, type);
}

/**
 * GET Handler - Generate OTP
 * Query: type=email|phone, target=value
 */
export const GET = unifiedApiHandler(async (req, ctx) => {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') as 'email' | 'phone';
    const target = searchParams.get('target');

    if (!type || !['email', 'phone'].includes(type)) {
        return errorResponse('Valid verification type (email or phone) is required', 400);
    }

    if (!target) {
        return errorResponse(`${type === 'email' ? 'Email' : 'Phone number'} is required`, 400);
    }

    const account = await resolveAccount(ctx, target, type);
    if (!account) {
        return errorResponse('Account not found. Please register first.', 404);
    }

    const result = await ctx.module.verification.generateOtp({
        type,
        target,
        accountId: account.accountId
    });

    if (!result.success) {
        return errorResponse(result.error, result.status);
    }

    return okResponse(result.data);
});

/**
 * POST Handler - Validate OTP
 * Body: { type, target, otp }
 */
export const POST = unifiedApiHandler(async (req, ctx) => {
    const body = await req.json().catch(() => ({}));
    const { type, target, otp } = body;

    if (!type || !['email', 'phone'].includes(type)) {
        return errorResponse('Valid verification type (email or phone) is required', 400);
    }

    if (!target || !otp) {
        return errorResponse('Target and OTP are required', 400);
    }

    const account = await resolveAccount(ctx, target, type);
    if (!account) {
        return errorResponse('Account not found. Please register first.', 404);
    }

    const result = await ctx.module.verification.validateOtp({
        type,
        target,
        otp,
        accountId: account.accountId,
        userId: account.userId
    });

    if (!result.success) {
        return errorResponse(result.error, result.status);
    }

    return okResponse(result.data);
});
