import { NextResponse } from 'next/server';

// ═══════════════════════════════════════════════════════════════
// STANDARD API RESPONSE ENVELOPE
// ═══════════════════════════════════════════════════════════════
//
// ✅ Success:  { success: true, data: T, message?: string }
// ✅ Paginated: { success: true, data: T[], pagination: {...} }
// ❌ Error:    { success: false, error: { code: string, message: string } }

export interface PaginationInfo {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}

// ═══════════════════════════════════════════════════════════════
// SUCCESS RESPONSES
// ═══════════════════════════════════════════════════════════════

export function okResponse<T>(data: T, message?: string) {
    return NextResponse.json({ success: true as const, data, ...(message && { message }) });
}

export function createdResponse<T>(data: T, message?: string) {
    return NextResponse.json({ success: true as const, data, ...(message && { message }) }, { status: 201 });
}

export function paginatedResponse<T>(data: T[], pagination: PaginationInfo) {
    return NextResponse.json({ success: true as const, data, pagination });
}

export function messageResponse(message: string) {
    return NextResponse.json({ success: true as const, message });
}

// ═══════════════════════════════════════════════════════════════
// ERROR RESPONSES
// ═══════════════════════════════════════════════════════════════

export function errorResponse(message: string | undefined, status = 400, code?: string) {
    const msg = message ?? 'An error occurred';
    return NextResponse.json(
        { success: false as const, error: { code: code ?? httpStatusToCode(status), message: msg } },
        { status }
    );
}

export function notFoundResponse(message = 'Resource not found') {
    return errorResponse(message, 404, 'NOT_FOUND');
}

export function forbiddenResponse(message = 'Access denied') {
    return errorResponse(message, 403, 'FORBIDDEN');
}

export function validationErrorResponse(message: string, errors?: Array<{ field: string; message: string }>) {
    return NextResponse.json(
        { success: false as const, error: { code: 'VALIDATION_ERROR', message, ...(errors && { errors }) } },
        { status: 400 }
    );
}

export function serverErrorResponse(message: string | undefined = 'Internal server error') {
    return errorResponse(message ?? 'Internal server error', 500, 'INTERNAL_ERROR');
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function httpStatusToCode(status: number): string {
    switch (status) {
        case 400: return 'BAD_REQUEST';
        case 401: return 'UNAUTHORIZED';
        case 403: return 'FORBIDDEN';
        case 404: return 'NOT_FOUND';
        case 409: return 'CONFLICT';
        case 422: return 'UNPROCESSABLE';
        case 429: return 'TOO_MANY_REQUESTS';
        case 500: return 'INTERNAL_ERROR';
        default: return 'ERROR';
    }
}
