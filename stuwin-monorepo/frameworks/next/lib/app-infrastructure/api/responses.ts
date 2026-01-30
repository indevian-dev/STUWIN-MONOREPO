// ═══════════════════════════════════════════════════════════════
// API RESPONSE TYPES
// ═══════════════════════════════════════════════════════════════
// Standardized API response structures

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
// SUCCESS API RESPONSE
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

// ═══════════════════════════════════════════════════════════════
// ERROR API RESPONSE
// ═══════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════
// PAGINATED API RESPONSE
// ═══════════════════════════════════════════════════════════════

export interface PaginatedApiResponse<TData> {
  data: TData[];
  pagination: PaginationMeta;
  meta?: {
    timestamp: string;
    requestId: string;
    took: number; // response time in ms
  };
}

// ═══════════════════════════════════════════════════════════════
// SINGLE ITEM API RESPONSE
// ═══════════════════════════════════════════════════════════════

export interface SingleApiResponse<TData> {
  data: TData;
  meta?: {
    timestamp: string;
    requestId: string;
    took: number;
  };
}

// ═══════════════════════════════════════════════════════════════
// UNION TYPE FOR ALL API RESPONSES
// ═══════════════════════════════════════════════════════════════

export type ApiResponse<TData = any> =
  | SuccessApiResponse<TData>
  | ErrorApiResponse
  | PaginatedApiResponse<TData>
  | SingleApiResponse<TData>;

// ═══════════════════════════════════════════════════════════════
// EXTENDED ERROR TYPES FOR CLIENT-SIDE HANDLING
// ═══════════════════════════════════════════════════════════════

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

