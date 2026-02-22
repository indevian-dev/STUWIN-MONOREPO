// ═══════════════════════════════════════════════════════════════
// SLIM ULID UTILITY
// ═══════════════════════════════════════════════════════════════
// Generates compact 16-character ULIDs (vs 26-char standard)
// Combines timestamp (10 chars) + random safety (6 chars)
// Used for users, workspaces, transactions, and other resources
// ═══════════════════════════════════════════════════════════════

import { ulid } from 'ulidx';

/**
 * Generate a slim ULID for use as resource identifiers
 * Reduces 26-char standard ULID to 16-char compact ID
 * Structure: [TIME(10)][RANDOM(6)] = 16 chars total
 *
 * @returns {string} 16-character slim ULID
 *
 * @example
 * const userId = generateSlimId();        // "01ARZ3NDEKTSV4RRFFQ69G5FAV"[0:10] + [20:26] = 16 chars
 * const workspaceId = generateSlimId();   // Different slim ID
 * const transactionId = generateSlimId(); // Another unique ID
 */
export const generateSlimId = (): string => {
  const fullId = ulid(); // 26 chars: [TIME(10)][RANDOM(16)]

  const timePart = fullId.slice(0, 10); // First 10 (Timestamp)
  const randomPart = fullId.slice(-6); // Last 6 (Random safety)

  return timePart + randomPart; // 16 chars total
};

/**
 * Batch generate multiple slim ULIDs
 * Useful for creating multiple resources at once
 *
 * @param {number} count - Number of IDs to generate
 * @returns {string[]} Array of slim ULIDs
 *
 * @example
 * const [userId, workspaceId] = generateSlimIds(2);
 * const transactionIds = generateSlimIds(10);
 */
export const generateSlimIds = (count: number): string[] => {
  return Array.from({ length: count }, () => generateSlimId());
};

/**
 * Validates if a string is a valid slim ULID format
 * Checks for correct length and character set
 *
 * @param {string} id - ID to validate
 * @returns {boolean} True if valid slim ULID format
 *
 * @example
 * const isValid = isValidSlimId('01ARZ3NDEKTS4RRF'); // true
 * const isInvalid = isValidSlimId('invalid'); // false
 */
export const isValidSlimId = (id: string): boolean => {
  // Slim ULID should be exactly 16 characters
  if (typeof id !== 'string' || id.length !== 16) {
    return false;
  }

  // Valid characters in ULID: 0-9, A-Z (excluding I, L, O, U)
  const ulidRegex = /^[0-9ABCDEFGHJKMNPQRSTVWXYZ]{16}$/i;
  return ulidRegex.test(id);
};

/**
 * Get timestamp from slim ULID
 * Extracts the first 10 characters which contain timestamp info
 *
 * @param {string} id - Slim ULID
 * @returns {string} Timestamp part of the ID
 *
 * @example
 * const timestamp = getSlimIdTimestamp('01ARZ3NDEKTS4RRF');
 */
export const getSlimIdTimestamp = (id: string): string => {
  if (!isValidSlimId(id)) {
    throw new Error('Invalid slim ULID format');
  }
  return id.slice(0, 10);
};

/**
 * Get random part from slim ULID
 * Extracts the last 6 characters which contain randomness
 *
 * @param {string} id - Slim ULID
 * @returns {string} Random part of the ID
 *
 * @example
 * const randomPart = getSlimIdRandom('01ARZ3NDEKTS4RRF');
 */
export const getSlimIdRandom = (id: string): string => {
  if (!isValidSlimId(id)) {
    throw new Error('Invalid slim ULID format');
  }
  return id.slice(-6);
};
