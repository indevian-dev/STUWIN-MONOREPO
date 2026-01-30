import { NextResponse } from 'next/server';
import { unifiedApiHandler } from '@/lib/app-access-control/interceptors';

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
        return NextResponse.json({ error: 'Valid verification type (email or phone) is required' }, { status: 400 });
    }

    if (!target) {
        return NextResponse.json({ error: `${type === 'email' ? 'Email' : 'Phone number'} is required` }, { status: 400 });
    }

    if (!authData) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await module.verification.generateOtp({
        type,
        target,
        accountId: authData.account.id.toString()
    });

    if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json(result.data, { status: result.status });
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
            return NextResponse.json({ error: 'Valid verification type (email or phone) is required' }, { status: 400 });
        }

        if (!target || !otp) {
            return NextResponse.json({ error: 'Target and OTP are required' }, { status: 400 });
        }

        if (!authData) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const result = await module.verification.validateOtp({
            type,
            target,
            otp,
            accountId: authData.account.id.toString(),
            userId: authData.user.id
        });

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: result.status });
        }

        return NextResponse.json(result.data, { status: result.status });
    } catch (error) {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
});
