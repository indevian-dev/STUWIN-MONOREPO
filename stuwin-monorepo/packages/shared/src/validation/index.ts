// ═══════════════════════════════════════════════════════════════
// UTILITY TYPES
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// VALIDATION TYPES
// ═══════════════════════════════════════════════════════════════

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

export interface EmailTemplate {
  subject: string;
  body: string;
  html?: string;
  templateId?: string;
}

export interface SMSTemplate {
  body: string;
  templateId?: string;
}

export interface AccessTokenPayload {
  accountId: string;
  userId: string;
  permissions: string[];
  iat: number;
  exp: number;
  // Additional properties used in the application
  uid?: string;
  aid?: string;
  sid?: string;
  name?: string;
  email?: string;
  phone?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  personal?: boolean;
  role?: string;
  suspended?: boolean;
  workspaceType?: string;
  workspaceId?: string;
  domain?: string;
  frequentlyUsedWorkspaces?: string[];
}

// ═══════════════════════════════════════════════════════════════
// OTP TYPES
// ═══════════════════════════════════════════════════════════════

export enum OtpType {
  EMAIL_VERIFICATION = 'email_verification',
  PHONE_VERIFICATION = 'phone_verification',
  PASSWORD_RESET = 'password_reset',
  TWO_FACTOR_AUTH_EMAIL = '2fa_email',
  TWO_FACTOR_AUTH_PHONE = '2fa_phone',
}

export interface OtpConfig {
  length: number;
  expiryMinutes: number;
  maxAttempts: number;
  type: OtpType;
}

export interface OtpVerification {
  code: string;
  type: OtpType;
  identifier: string; // email or phone
}

// ═══════════════════════════════════════════════════════════════
// COMMON UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

// Type-safe object key extraction
export function keysOf<T extends object>(obj: T): Array<keyof T> {
  return Object.keys(obj) as Array<keyof T>;
}

// Type-safe object values extraction
export function valuesOf<T extends object>(obj: T): Array<T[keyof T]> {
  return Object.values(obj) as Array<T[keyof T]>;
}

// Type-safe object entries extraction
export function entriesOf<T extends object>(obj: T): Array<[keyof T, T[keyof T]]> {
  return Object.entries(obj) as Array<[keyof T, T[keyof T]]>;
}

// ═══════════════════════════════════════════════════════════════
// TYPE GUARDS
// ═══════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════
// BRANDED TYPES UTILITIES
// ═══════════════════════════════════════════════════════════════

export type Brand<T, B> = T & { readonly __brand: B };

export function brand<T, B extends string>(value: T, _brand: B): Brand<T, B> {
  return value as Brand<T, B>;
}

export function unbrand<T, B>(branded: Brand<T, B>): T {
  return branded as T;
}

// ═══════════════════════════════════════════════════════════════
// DEEP UTILITY TYPES
// ═══════════════════════════════════════════════════════════════

export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

// ═══════════════════════════════════════════════════════════════
// PROMISE UTILITIES
// ═══════════════════════════════════════════════════════════════

export type Awaited<T> = T extends PromiseLike<infer U> ? U : T;

export type PromiseReturnType<T extends (...args: any) => any> = Awaited<ReturnType<T>>;

// ═══════════════════════════════════════════════════════════════
// STRING UTILITIES
// ═══════════════════════════════════════════════════════════════

export type Capitalize<S extends string> = S extends `${infer F}${infer R}` ? `${Uppercase<F>}${R}` : S;

export type Uncapitalize<S extends string> = S extends `${infer F}${infer R}` ? `${Lowercase<F>}${R}` : S;

// ═══════════════════════════════════════════════════════════════
// ARRAY UTILITIES
// ═══════════════════════════════════════════════════════════════

export type Head<T extends readonly unknown[]> = T extends readonly [infer H, ...unknown[]] ? H : never;

export type Tail<T extends readonly unknown[]> = T extends readonly [unknown, ...infer T] ? T : [];

export type Length<T extends readonly unknown[]> = T['length'];

// ═══════════════════════════════════════════════════════════════
// FUNCTION UTILITIES
// ═══════════════════════════════════════════════════════════════

export type Parameters<T extends (...args: any) => any> = T extends (...args: infer P) => any ? P : never;

export type ReturnType<T extends (...args: any) => any> = T extends (...args: any) => infer R ? R : any;

// ═══════════════════════════════════════════════════════════════
// CONDITIONAL UTILITIES
// ═══════════════════════════════════════════════════════════════

export type If<C extends boolean, T, F> = C extends true ? T : F;

export type Equals<A, B> = A extends B ? (B extends A ? true : false) : false;

// ═══════════════════════════════════════════════════════════════
// TEMPLATE LITERALS
// ═══════════════════════════════════════════════════════════════

export type Join<T extends readonly string[], D extends string> =
  T extends readonly [infer F, ...infer R]
  ? F extends string
  ? R extends readonly string[]
  ? R extends readonly []
  ? F
  : `${F}${D}${Join<R, D>}`
  : never
  : never
  : '';

export type Split<S extends string, D extends string> =
  S extends `${infer T}${D}${infer U}` ? [T, ...Split<U, D>] : [S];

// ═══════════════════════════════════════════════════════════════════════════════
// LEGACY COMPATIBILITY (if needed during migration)
// ═══════════════════════════════════════════════════════════════════════════════

// TODO: Add legacy type aliases if migrating from old system

