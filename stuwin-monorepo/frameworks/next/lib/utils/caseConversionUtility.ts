
/**
 * Case Conversion Utility
 * 
 * Converts between database snake_case and TypeScript camelCase
 * Use this when working with raw SQL queries that return snake_case columns
 */

// ═══════════════════════════════════════════════════════════════
// CONVERSION FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Converts a snake_case string to camelCase
 * @example snakeToCamel('created_at') // 'createdAt'
 */
export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Converts a camelCase string to snake_case
 * @example camelToSnake('createdAt') // 'created_at'
 */
export function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * Converts all keys in an object from snake_case to camelCase
 * @example toCamelCase({ created_at: '2024-01-01', user_id: 123 })
 * // { createdAt: '2024-01-01', userId: 123 }
 */
export function toCamelCase<T = any>(obj: Record<string, any>): T {
  if (obj === null || obj === undefined) {
    return obj as T;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => toCamelCase(item)) as T;
  }

  if (typeof obj !== 'object') {
    return obj as T;
  }

  const result: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    const camelKey = snakeToCamel(key);

    // Recursively convert nested objects
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[camelKey] = toCamelCase(value);
    } else if (Array.isArray(value)) {
      result[camelKey] = value.map(item =>
        item && typeof item === 'object' ? toCamelCase(item) : item
      );
    } else {
      result[camelKey] = value;
    }
  }

  return result as T;
}

/**
 * Converts all keys in an object from camelCase to snake_case
 * @example toSnakeCase({ createdAt: '2024-01-01', userId: 123 })
 * // { created_at: '2024-01-01', user_id: 123 }
 */
export function toSnakeCase<T = any>(obj: Record<string, any>): T {
  if (obj === null || obj === undefined) {
    return obj as T;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => toSnakeCase(item)) as T;
  }

  if (typeof obj !== 'object') {
    return obj as T;
  }

  const result: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = camelToSnake(key);

    // Recursively convert nested objects
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[snakeKey] = toSnakeCase(value);
    } else if (Array.isArray(value)) {
      result[snakeKey] = value.map(item =>
        item && typeof item === 'object' ? toSnakeCase(item) : item
      );
    } else {
      result[snakeKey] = value;
    }
  }

  return result as T;
}

/**
 * Converts an array of objects from snake_case to camelCase
 * @example toCamelCaseArray([{ created_at: '2024-01-01' }])
 * // [{ createdAt: '2024-01-01' }]
 */
export function toCamelCaseArray<T = any>(arr: Record<string, any>[]): T[] {
  return arr.map(obj => toCamelCase<T>(obj));
}

/**
 * Converts an array of objects from camelCase to snake_case
 * @example toSnakeCaseArray([{ createdAt: '2024-01-01' }])
 * // [{ created_at: '2024-01-01' }]
 */
export function toSnakeCaseArray<T = any>(arr: Record<string, any>[]): T[] {
  return arr.map(obj => toSnakeCase<T>(obj));
}

// ═══════════════════════════════════════════════════════════════
// USAGE EXAMPLES
// ═══════════════════════════════════════════════════════════════

/* 
EXAMPLE 1: Converting raw SQL results to TypeScript types

// ❌ BAD - Type mismatch
const users = await sql`SELECT * FROM users`;
const user = users[0]; // { created_at: ..., email_is_verified: ... }
// TypeScript expects: { createdAt: ..., emailIsVerified: ... }

// ✅ GOOD - Use the utility
import { toCamelCaseArray } from '@/lib/utils/caseConversionUtility';
import { User } from '@/types/domain/users';

const usersRaw = await sql`SELECT * FROM users`;
const users = toCamelCaseArray<User>(usersRaw);
const user = users[0]; // { createdAt: ..., emailIsVerified: ... } ✓

---

EXAMPLE 2: Converting input for raw SQL inserts

// ✅ Convert TypeScript data to database format
import { toSnakeCase } from '@/lib/utils/caseConversionUtility';

const userData = {
  email: 'user@example.com',
  emailIsVerified: true,
  createdAt: new Date().toISOString()
};

const dbData = toSnakeCase(userData);
// { email: '...', email_is_verified: true, created_at: '...' }

await sql`
  INSERT INTO users ${sql(dbData)}
`;

---



*/

