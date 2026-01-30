import { NextResponse } from "next/server";
import type { ApiValidationResult } from "@/types";

/**
 * Map validation result to appropriate API response
 */
export function mapValidationToResponse(result: ApiValidationResult): NextResponse {
    switch (result.code) {
        case 'UNAUTHORIZED':
            return NextResponse.json(
                { error: 'Unauthorized', code: result.code },
                { status: 401 }
            );

        case 'ACCOUNT_SUSPENDED':
            return NextResponse.json(
                { error: 'Account suspended', code: result.code },
                { status: 403 }
            );

        case 'EMAIL_NOT_VERIFIED':
            return NextResponse.json(
                { error: 'Email verification required', code: result.code },
                { status: 403 }
            );

        case 'PHONE_NOT_VERIFIED':
            return NextResponse.json(
                { error: 'Phone verification required', code: result.code },
                { status: 403 }
            );

        case 'VERIFY_EMAIL_REQUIRED':
            return NextResponse.json(
                {
                    error: 'Email verification required to access this resource',
                    code: result.code,
                    redirectTo: '/auth/verify?type=email'
                },
                { status: 403 }
            );

        case 'VERIFY_PHONE_REQUIRED':
            return NextResponse.json(
                {
                    error: 'Phone verification required to access this resource',
                    code: result.code,
                    redirectTo: '/auth/verify?type=phone'
                },
                { status: 403 }
            );

        case 'PERMISSION_DENIED':
            return NextResponse.json(
                { error: 'Permission denied', code: result.code },
                { status: 403 }
            );

        case 'WORKSPACE_MISMATCH':
            return NextResponse.json(
                { error: 'Workspace mismatch', code: result.code },
                { status: 403 }
            );

        case '2FA_EMAIL_REQUIRED':
        case '2FA_PHONE_REQUIRED':
            return NextResponse.json(
                {
                    error: '2FA verification required',
                    code: result.code,
                    twoFactorAuthType: (result as any).twoFactorAuthType
                },
                { status: 403 }
            );

        default:
            return NextResponse.json(
                { error: 'Access denied', code: result.code || 'UNKNOWN' },
                { status: 403 }
            );
    }
}
