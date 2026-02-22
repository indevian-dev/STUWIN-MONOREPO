// Validation Types

export interface ValidationSchema {
  [key: string]: {
    rules: ValidationRule[];
    sanitizers?: SanitizerFunction[];
  };
}

export interface ValidationRule<T = unknown> {
  validate: (value: T) => boolean;
  message: string;
}

export type ValidationFunction = (value: any, field: string) => ValidationError | null;
export type SanitizerFunction<TInput = unknown, TOutput = TInput> = (value: TInput) => TOutput;

export interface ValidationResult<T = unknown> {
  isValid: boolean;
  errors: ValidationError[];
  sanitized: T | null;
  firstError: ValidationError | null;
}

export interface ValidationError {
  field: string;
  code: string;
  message: string;
  value?: any;
}

// Type-safe Object Utilities

export function keysOf<T extends object>(obj: T): Array<keyof T> {
  return Object.keys(obj) as Array<keyof T>;
}

export function valuesOf<T extends object>(obj: T): Array<T[keyof T]> {
  return Object.values(obj) as Array<T[keyof T]>;
}

export function entriesOf<T extends object>(obj: T): Array<[keyof T, T[keyof T]]> {
  return Object.entries(obj) as Array<[keyof T, T[keyof T]]>;
}

// Type Guards

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

export function isArray<T>(value: unknown, guard?: (item: unknown) => item is T): value is T[] {
  return Array.isArray(value) && (!guard || value.every(guard));
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isEmail(value: unknown): value is string {
  return isString(value) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

// Branded Types

export type Brand<T, B> = T & { readonly __brand: B };

export function brand<T, B extends string>(value: T, _brand: B): Brand<T, B> {
  return value as Brand<T, B>;
}

export function unbrand<T, B>(branded: Brand<T, B>): T {
  return branded as T;
}

// Deep Utility Types

export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

// Utility Types

export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;
export type RequiredExcept<T, K extends keyof T> = Required<T> & Partial<Pick<T, K>>;
