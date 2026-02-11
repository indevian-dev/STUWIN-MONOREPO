
import type { AuthContext } from '@/lib/domain/base/types';

// ═══════════════════════════════════════════════════════════════
// API REQUEST & CONTEXT
// ═══════════════════════════════════════════════════════════════

export interface ApiRequest<TBody = any> {
    body?: TBody;
    params?: Record<string, string>;
    query?: Record<string, string | string[]>;
    headers?: Record<string, string>;
    user?: {
        id: string;
        accountId: string;
        permissions: string[];
    };
}

export type ApiHandler<TRequest = any, TResponse = any> = (
    request: Request,
    context: ServerApiHandlerContext
) => Promise<Response>;

export interface ServerApiHandlerContext {
    authData?: {
        userId: string;
        accountId: string;
        permissions: string[];
    };
    requestId: string;
    startTime: number;
}

// ═══════════════════════════════════════════════════════════════
// API VALIDATION RESULT
// ═══════════════════════════════════════════════════════════════

export interface ApiValidationResult {
    isValid: boolean;
    code?: string;
    authData?: any;
    ctx?: AuthContext;
    accountId?: string;
    userId?: string;
    needsRefresh?: boolean;
    step: string;
}

// ═══════════════════════════════════════════════════════════════
// PAGINATION TYPES
// ═══════════════════════════════════════════════════════════════

export interface PaginationParams {
    page?: number;
    pageSize?: number;
}

export interface PaginationMeta {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

// ═══════════════════════════════════════════════════════════════
// API RESPONSE TYPES
// ═══════════════════════════════════════════════════════════════

export interface SuccessApiResponse<TData = void> {
    success: true;
    data?: TData;
    message?: string;
    meta?: {
        timestamp: string;
        requestId: string;
        took: number;
    };
}

export interface ErrorApiResponse {
    success: false;
    error: {
        code: string;
        message: string;
        details?: any;
        validationErrors?: Array<{
            field: string;
            message: string;
        }>;
    };
    meta?: {
        timestamp: string;
        requestId: string;
    };
}

export interface PaginatedApiResponse<TData> {
    data: TData[];
    pagination: PaginationMeta;
    meta?: {
        timestamp: string;
        requestId: string;
        took: number; // response time in ms
    };
}

export interface SingleApiResponse<TData> {
    data: TData;
    meta?: {
        timestamp: string;
        requestId: string;
        took: number;
    };
}

export type ApiResponse<TData = any> =
    | SuccessApiResponse<TData>
    | ErrorApiResponse
    | PaginatedApiResponse<TData>
    | SingleApiResponse<TData>;

export interface ApiError extends Error {
    status?: number;
    code?: string;
    response?: {
        status: number;
        data: any;
    };
    method?: string;
    originalRequest?: any;
}

export interface ErrorApiResponseExtended extends ErrorApiResponse {
    status?: number;
    code?: string;
    response?: {
        status: number;
        data: any;
    };
    message?: string; // For compatibility with Error interface
}

// ═══════════════════════════════════════════════════════════════
// FILE UPLOAD
// ═══════════════════════════════════════════════════════════════

export interface UploadConfig {
    maxSize: number;
    allowedTypes: string[];
    allowedExtensions: string[];
    destination: string;
    generateThumbnails?: boolean;
    thumbnailSizes?: Array<{
        width: number;
        height: number;
        suffix: string;
    }>;
}

export interface UploadResult {
    url: string;
    key: string;
    size: number;
    mimeType: string;
    width?: number;
    height?: number;
    thumbnails?: Array<{
        url: string;
        size: string;
    }>;
}

// ═══════════════════════════════════════════════════════════════
// SEARCH
// ═══════════════════════════════════════════════════════════════

export interface SearchQuery {
    query: string;
    filters?: Record<string, any>;
    sort?: {
        field: string;
        order: 'asc' | 'desc';
    };
    pagination?: {
        page: number;
        pageSize: number;
    };
}

export interface SearchResult<T = any> {
    items: T[];
    total: number;
    took: number;
    facets?: Record<string, Array<{
        value: string;
        count: number;
    }>>;
    highlights?: Record<string, string[]>;
}

// ═══════════════════════════════════════════════════════════════
// JOBS (EXPORT/IMPORT)
// ═══════════════════════════════════════════════════════════════

export interface ExportJob {
    id: string;
    type: 'csv' | 'json' | 'xlsx';
    status: 'pending' | 'processing' | 'completed' | 'failed';
    filters?: Record<string, any>;
    createdBy: number;
    createdAt: string;
    completedAt?: string;
    fileUrl?: string;
    error?: string;
}

export interface ImportJob {
    id: string;
    type: 'csv' | 'json' | 'xlsx';
    status: 'pending' | 'processing' | 'completed' | 'failed';
    totalRows: number;
    processedRows: number;
    errors: Array<{
        row: number;
        field?: string;
        message: string;
    }>;
    createdBy: number;
    createdAt: string;
    completedAt?: string;
    fileUrl?: string;
}

// ═══════════════════════════════════════════════════════════════
// CACHE
// ═══════════════════════════════════════════════════════════════

export interface CacheEntry<T = any> {
    data: T;
    expiresAt: number;
    createdAt: number;
    hits: number;
}

export interface CacheConfig {
    ttl: number;
    maxSize?: number;
    strategy: 'lru' | 'fifo' | 'lfu';
}
