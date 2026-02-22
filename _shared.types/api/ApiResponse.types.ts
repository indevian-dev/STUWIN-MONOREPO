// Shared API Response Types

// Pagination

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

// Success Response

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

// Error Response

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

// Paginated Response

export interface PaginatedApiResponse<TData> {
    data: TData[];
    pagination: PaginationMeta;
    meta?: {
        timestamp: string;
        requestId: string;
        took: number;
    };
}

// Single Item Response

export interface SingleApiResponse<TData> {
    data: TData;
    meta?: {
        timestamp: string;
        requestId: string;
        took: number;
    };
}

// Union Type

export type ApiResponse<TData = any> =
    | SuccessApiResponse<TData>
    | ErrorApiResponse
    | PaginatedApiResponse<TData>
    | SingleApiResponse<TData>;

// Client-side Error Handling

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
    message?: string;
}
