// ═══════════════════════════════════════════════════════════════
// SHARED BASE TYPES
// ═══════════════════════════════════════════════════════════════

// Generic base types used across the application

// ═══════════════════════════════════════════════════════════════
// TIMESTAMPS
// ═══════════════════════════════════════════════════════════════

export interface Timestamps {
  createdAt: string;
  updatedAt?: string;
}

// ═══════════════════════════════════════════════════════════════
// SORTING & FILTERING
// ═══════════════════════════════════════════════════════════════

export interface SortOrder {
  field: string;
  direction: 'asc' | 'desc';
}

export interface FilterParams {
  [key: string]: any;
}

// ═══════════════════════════════════════════════════════════════
// CRUD OPERATIONS
// ═══════════════════════════════════════════════════════════════

// Using 'any' for result to leverage refined types in infrastructure
export interface CrudOperations<TCreate, TUpdate = Partial<TCreate>> {
  create: (data: TCreate) => Promise<any>;
  read: (id: string) => Promise<any>;
  update: (id: string, data: TUpdate) => Promise<any>;
  delete: (id: string) => Promise<any>;
  list: (params?: any) => Promise<any>;
}

// ═══════════════════════════════════════════════════════════════
// LOCATION & GEO
// ═══════════════════════════════════════════════════════════════

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  country?: string;
}

export interface GeoBounds {
  northEast: {
    latitude: number;
    longitude: number;
  };
  southWest: {
    latitude: number;
    longitude: number;
  };
}

// ═══════════════════════════════════════════════════════════════
// FILE UPLOAD
// ═══════════════════════════════════════════════════════════════

export interface FileUpload {
  fieldName: string;
  originalName: string;
  mimeType: string;
  size: number;
  buffer: Buffer;
  url?: string;
  key?: string;
}

export interface ImageUpload extends FileUpload {
  width?: number;
  height?: number;
  format?: string;
}

// ═══════════════════════════════════════════════════════════════
// NOTIFICATION PAYLOADS
// ═══════════════════════════════════════════════════════════════

export interface NotificationPayload {
  title: string;
  body: string;
  type: 'info' | 'success' | 'warning' | 'error';
  actionUrl?: string;
  metadata?: Record<string, any>;
}

// ═══════════════════════════════════════════════════════════════
// SEARCH
// ═══════════════════════════════════════════════════════════════

export interface SearchFilters {
  query?: string;
  category?: string;
  tags?: string[];
  dateRange?: {
    from: string;
    to: string;
  };
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ═══════════════════════════════════════════════════════════════
// UTILITY TYPES
// ═══════════════════════════════════════════════════════════════

// Make all properties optional except specified ones
export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;

// Make all properties required except specified ones
export type RequiredExcept<T, K extends keyof T> = Required<T> & Partial<Pick<T, K>>;

// Extract keys of properties that are not undefined
export type DefinedKeys<T> = {
  [K in keyof T]: T[K] extends undefined ? never : K;
}[keyof T];

// Create a type with only defined properties
export type Defined<T> = Pick<T, DefinedKeys<T>>;

// Non-nullable type
export type NonNullable<T> = T extends null | undefined ? never : T;
