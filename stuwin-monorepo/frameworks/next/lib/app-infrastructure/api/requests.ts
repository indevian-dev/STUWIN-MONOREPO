// ═══════════════════════════════════════════════════════════════
// API REQUEST TYPES
// ═══════════════════════════════════════════════════════════════
// Types for handling API requests

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

// ═══════════════════════════════════════════════════════════════
// HANDLER CONTEXT TYPES
// ═══════════════════════════════════════════════════════════════

export interface ApiHandlerContext {
  authData?: {
    userId: string;
    accountId: string;
    permissions: string[];
  };
  requestId: string;
  startTime: number;
}

export type ApiHandler<TRequest = any, TResponse = any> = (
  request: Request,
  context: ApiHandlerContext
) => Promise<Response>;

// ═══════════════════════════════════════════════════════════════
// FILE UPLOAD TYPES
// ═══════════════════════════════════════════════════════════════

export interface UploadConfig {
  maxSize: number; // in bytes
  allowedTypes: string[]; // mime types
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
// SEARCH TYPES
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
  took: number; // search time in ms
  facets?: Record<string, Array<{
    value: string;
    count: number;
  }>>;
  highlights?: Record<string, string[]>;
}

// ═══════════════════════════════════════════════════════════════
// EXPORT/IMPORT TYPES
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
// CACHE TYPES
// ═══════════════════════════════════════════════════════════════

export interface CacheEntry<T = any> {
  data: T;
  expiresAt: number;
  createdAt: number;
  hits: number;
}

export interface CacheConfig {
  ttl: number; // time to live in seconds
  maxSize?: number; // max entries
  strategy: 'lru' | 'fifo' | 'lfu';
}

