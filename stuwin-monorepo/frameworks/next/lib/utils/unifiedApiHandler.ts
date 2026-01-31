/**
 * Unified API Route Handler
 * 
 * This helper consolidates multiple HTTP methods (GET, POST, PATCH, DELETE, PUT)
 * into a single route.ts file, reducing duplication and improving maintainability.
 * 
 * Usage:
 * ```typescript
 * import { createUnifiedHandler } from '@/lib/helpers/createUnifiedHandler';
 * 
 * export const GET = createUnifiedHandler(getHandler);
 * export const POST = createUnifiedHandler(postHandler);
 * export const PATCH = createUnifiedHandler(patchHandler);
 * export const DELETE = createUnifiedHandler(deleteHandler);
 * ```
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { ApiRouteHandler, ApiHandlerContext } from '@/types/next';

/**
 * Creates a unified error response
 */
export function createErrorResponse(
  message: string,
  status: number = 400,
  details?: any
) {
  return NextResponse.json(
    {
      error: message,
      ...(details && { details }),
    },
    { status }
  );
}

/**
 * Creates a unified success response
 */
export function createSuccessResponse(
  data: any,
  status: number = 200,
  meta?: { total?: number; page?: number; limit?: number; totalPages?: number }
) {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(meta && { meta }),
    },
    { status }
  );
}

/**
 * Creates a no-content response (for DELETE operations)
 */
export function createNoContentResponse() {
  return new NextResponse(null, { status: 204 });
}

/**
 * Type definition for unified handler methods
 */
export type UnifiedHandlerMethod = (
  request: NextRequest,
  context: ApiHandlerContext
) => Promise<NextResponse>;

/**
 * Validates required parameters in URL path
 */
export function validateRequiredParams(
  params: Record<string, any>,
  requiredFields: string[]
): { valid: boolean; error?: string } {
  for (const field of requiredFields) {
    if (!params[field]) {
      return {
        valid: false,
        error: `Missing required parameter: ${field}`,
      };
    }
  }
  return { valid: true };
}

/**
 * Validates required fields in request body
 */
export async function validateRequestBody(
  request: NextRequest,
  requiredFields?: string[]
): Promise<{ valid: boolean; data?: any; error?: string }> {
  try {
    const data = await request.json();

    if (requiredFields && requiredFields.length > 0) {
      const missing = requiredFields.filter(field => !(field in data));
      if (missing.length > 0) {
        return {
          valid: false,
          error: `Missing required fields: ${missing.join(', ')}`,
        };
      }
    }

    return { valid: true, data };
  } catch (error) {
    return {
      valid: false,
      error: 'Invalid JSON in request body',
    };
  }
}



/**
 * Validates partial update payload (for PATCH requests)
 */
export async function validatePartialUpdate(
  request: NextRequest,
  allowedFields: string[]
): Promise<{ valid: boolean; data?: any; error?: string }> {
  try {
    const data = await request.json();

    // Check if at least one field is provided
    if (Object.keys(data).length === 0) {
      return {
        valid: false,
        error: 'At least one field must be provided for update',
      };
    }

    // Check if all provided fields are allowed
    const invalidFields = Object.keys(data).filter(
      field => !allowedFields.includes(field)
    );
    if (invalidFields.length > 0) {
      return {
        valid: false,
        error: `Invalid fields: ${invalidFields.join(', ')}. Allowed: ${allowedFields.join(', ')}`,
      };
    }

    return { valid: true, data };
  } catch (error) {
    return {
      valid: false,
      error: 'Invalid JSON in request body',
    };
  }
}

/**
 * Extracts pagination parameters from URL search params
 */
export function getPaginationParams(request: NextRequest) {
  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
  const limit = Math.min(100, parseInt(url.searchParams.get('limit') || '10'));
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

/**
 * Extracts query parameters into filters
 */
export function extractFilters(
  request: NextRequest,
  allowedFilters: string[]
): Record<string, any> {
  const url = new URL(request.url);
  const filters: Record<string, any> = {};

  allowedFilters.forEach(filter => {
    const value = url.searchParams.get(filter);
    if (value !== null) {
      // Try to parse as JSON if possible (for arrays/objects)
      try {
        filters[filter] = JSON.parse(value);
      } catch {
        filters[filter] = value;
      }
    }
  });

  return filters;
}

/**
 * Logs API action for audit trail
 */
export async function logAction(
  db: any,
  action: string,
  accountId: string,
  resourceType: string,
  resourceId: string,
  details?: any
) {
  try {
    // Implementation depends on your logging system
    // Example: await db.createActionLog({ action, accountId, resourceType, resourceId, details, timestamp: new Date() });
  } catch (error) {
    console.error('Failed to log action:', error);
    // Don't throw - logging failure shouldn't break the main operation
  }
}

/**
 * Checks if a resource is owned by the current user
 */
export function verifyOwnership(
  resource: any,
  currentUserId: string,
  ownershipField: string = 'authorAccountId'
): boolean {
  return resource?.[ownershipField] === currentUserId;
}

/**
 * Handles soft delete by setting deletedAt timestamp
 */
export function prepareSoftDeleteUpdate() {
  return {
    deletedAt: new Date(),
  };
}

/**
 * Creates a response with standard pagination metadata
 */
export function createPaginatedResponse(
  data: any[],
  total: number,
  page: number,
  limit: number
) {
  const totalPages = Math.ceil(total / limit);

  return createSuccessResponse(data, 200, {
    total,
    page,
    limit,
    totalPages,
  });
}

