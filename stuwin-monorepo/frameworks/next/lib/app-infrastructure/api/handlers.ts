// ═══════════════════════════════════════════════════════════════
// API HANDLERS & HELPERS
// ═══════════════════════════════════════════════════════════════
// 🔥 TypedApiHandler, Pagination helpers, and response utilities
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import {
  ApiResponse,
  PaginatedApiResponse,
  SuccessApiResponse,
  ErrorApiResponse,
  PaginationMeta,
  PaginationParams
} from '@/lib/app-infrastructure/types';
import type { AuthData } from '@/lib/app-core-modules/auth/types';

import { ConsoleLogger } from '@/lib/app-infrastructure/loggers/ConsoleLogger';
// ═══════════════════════════════════════════════════════════════
// TYPED API HANDLER
// ═══════════════════════════════════════════════════════════════

export interface TypedApiHandlerContext {
  authData?: AuthData;
  requestId: string;
  startTime: number;
  params: Promise<Record<string, string>>;
  searchParams?: URLSearchParams;
}

export type TypedApiHandler<
  TRequest = any,
  TResponse = any
> = (
  request: NextRequest,
  context: TypedApiHandlerContext
) => Promise<NextResponse<TResponse>>;

// ═══════════════════════════════════════════════════════════════
// PAGINATION HELPERS
// ═══════════════════════════════════════════════════════════════

export function extractPaginationParams(searchParams: URLSearchParams): Required<PaginationParams> {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const pageSize = Math.max(1, Math.min(100, parseInt(searchParams.get('pageSize') || '10')));

  return { page, pageSize };
}

export function createPaginationMeta(
  page: number,
  pageSize: number,
  total: number
): PaginationMeta {
  const totalPages = Math.ceil(total / pageSize);

  return {
    page,
    pageSize,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

// ═══════════════════════════════════════════════════════════════
// RESPONSE HELPERS
// ═══════════════════════════════════════════════════════════════

export function successResponse<TData = void>(
  data?: TData,
  status: number = 200,
  message?: string
): NextResponse<SuccessApiResponse<TData>> {
  const response: SuccessApiResponse<TData> = {
    success: true,
    data,
    message,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID(),
      took: Date.now() - (global as any).requestStartTime || 0,
    },
  };

  return NextResponse.json(response, { status });
}

export function errorResponse(
  code: string,
  message: string,
  status: number = 400,
  details?: any
): NextResponse<ErrorApiResponse> {
  const response: ErrorApiResponse = {
    success: false,
    error: {
      code,
      message,
      details,
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID(),
    },
  };

  return NextResponse.json(response, { status });
}

export function paginatedResponse<TData>(
  data: TData[],
  pagination: PaginationMeta,
  status: number = 200
): NextResponse<PaginatedApiResponse<TData>> {
  const response: PaginatedApiResponse<TData> = {
    data,
    pagination,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID(),
      took: Date.now() - (global as any).requestStartTime || 0,
    },
  };

  return NextResponse.json(response, { status });
}

export function validationErrorResponse(
  errors: Array<{ field: string; message: string }>,
  status: number = 422
): NextResponse<ErrorApiResponse> {
  const response: ErrorApiResponse = {
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      validationErrors: errors,
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID(),
    },
  };

  return NextResponse.json(response, { status });
}

// ═══════════════════════════════════════════════════════════════
// API HANDLER WRAPPER
// ═══════════════════════════════════════════════════════════════

export function withTypedApiHandler<
  TRequest = any,
  TResponse = any
>(
  handler: TypedApiHandler<TRequest, TResponse>,
  options: {
    requireAuth?: boolean;
    permissions?: string[];
    validateBody?: (body: any) => { isValid: boolean; errors?: any[] };
  } = {}
) {
  return async (
    request: NextRequest,
    context: { params?: Record<string, string> }
  ): Promise<NextResponse> => {
    const startTime = Date.now();
    (global as any).requestStartTime = startTime;

    try {
      // Extract context
      const requestId = crypto.randomUUID();
      const searchParams = request.nextUrl.searchParams;

      // TODO: Extract auth data from request
      const authData: AuthData | undefined = undefined; // Implement auth extraction

      // Check authentication
      if (options.requireAuth && !authData) {
        return errorResponse('UNAUTHORIZED', 'Authentication required', 401);
      }

      // TODO: Implement permission checking
      // Check permissions
      // if (options.permissions && authData && authData.permissions) {
      //   const hasPermission = options.permissions.some(permission =>
      //     authData.permissions.includes(permission)
      //   );
      //   if (!hasPermission) {
      //     return errorResponse('FORBIDDEN', 'Insufficient permissions', 403);
      //   }
      // }

      // Validate body if needed
      if (options.validateBody && request.method !== 'GET') {
        try {
          const body = await request.json();
          const validation = options.validateBody(body);
          if (!validation.isValid) {
            return validationErrorResponse(validation.errors || []);
          }
        } catch (error) {
          return errorResponse('INVALID_JSON', 'Invalid JSON in request body', 400);
        }
      }

      // Call the handler
      const handlerContext: TypedApiHandlerContext = {
        authData,
        requestId,
        startTime,
        params: Promise.resolve(context.params || {}),
        searchParams,
      };

      return await handler(request, handlerContext);

    } catch (error) {
      ConsoleLogger.error('API Handler Error:', error);

      // Handle specific error types
      if (error instanceof Error) {
        return errorResponse('INTERNAL_ERROR', error.message, 500);
      }

      return errorResponse('UNKNOWN_ERROR', 'An unknown error occurred', 500);
    }
  };
}

// ═══════════════════════════════════════════════════════════════
// HTTP STATUS HELPERS
// ═══════════════════════════════════════════════════════════════

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// ═══════════════════════════════════════════════════════════════
// COMMON ERROR CODES
// ═══════════════════════════════════════════════════════════════

export const ERROR_CODES = {
  // Authentication
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_JSON: 'INVALID_JSON',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',

  // Resources
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',

  // Business Logic
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  ACCOUNT_SUSPENDED: 'ACCOUNT_SUSPENDED',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',

  // System
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
} as const;

// ═══════════════════════════════════════════════════════════════
// REQUEST HELPERS
// ═══════════════════════════════════════════════════════════════

export async function parseJsonBody<T = any>(request: NextRequest): Promise<T> {
  try {
    return await request.json();
  } catch (error) {
    throw new Error('Invalid JSON in request body');
  }
}

export function getSearchParam(searchParams: URLSearchParams, key: string): string | null {
  return searchParams.get(key);
}

export function getSearchParamNumber(searchParams: URLSearchParams, key: string, defaultValue = 0): number {
  const value = searchParams.get(key);
  const parsed = parseInt(value || '', 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

export function getSearchParamBoolean(searchParams: URLSearchParams, key: string, defaultValue = false): boolean {
  const value = searchParams.get(key);
  if (value === null) return defaultValue;
  return value.toLowerCase() === 'true';
}

// ═══════════════════════════════════════════════════════════════
// CORS HELPERS
// ═══════════════════════════════════════════════════════════════

export function createCorsHeaders(origin?: string) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
  };
}

export function handleOptionsRequest(): NextResponse {
  return new NextResponse(null, {
    status: 200,
    headers: createCorsHeaders(),
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY TYPES FOR HANDLERS
// ═══════════════════════════════════════════════════════════════════════════════

export type ApiHandlerResult<T> =
  | { success: true; data: T; status?: number }
  | { success: false; error: string; status?: number; code?: string };

// Helper to create typed handler results
export function createHandlerResult<T>(
  result: ApiHandlerResult<T>
): NextResponse {
  if (result.success) {
    return successResponse(result.data, result.status);
  } else {
    return errorResponse(result.code || 'ERROR', result.error, result.status || 400);
  }
}

