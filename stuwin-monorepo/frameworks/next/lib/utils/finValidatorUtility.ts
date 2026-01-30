/**
 * FIN Code Validation Utility
 * 
 * FIN (Financial Identification Number) validation for Azerbaijan
 * Format: 7 alphanumeric characters (A-Z, 0-9), no symbols
 */

/**
 * Validates FIN code format
 * @param fin - The FIN code to validate
 * @returns Object with validation result and cleaned FIN
 */
export function validateFIN(fin: string | null | undefined): {
  isValid: boolean;
  cleaned: string | null;
  error?: string;
} {
  // Check if FIN is provided
  if (!fin) {
    return {
      isValid: false,
      cleaned: null,
      error: 'FIN code is required'
    };
  }

  // Remove whitespace and convert to uppercase
  const cleaned = fin.trim().toUpperCase();

  // Check length
  if (cleaned.length !== 7) {
    return {
      isValid: false,
      cleaned: null,
      error: 'FIN code must be exactly 7 characters'
    };
  }

  // Check for valid characters (only A-Z and 0-9)
  const validPattern = /^[A-Z0-9]{7}$/;
  if (!validPattern.test(cleaned)) {
    return {
      isValid: false,
      cleaned: null,
      error: 'FIN code can only contain letters (A-Z) and numbers (0-9)'
    };
  }

  return {
    isValid: true,
    cleaned
  };
}

/**
 * Cleans and formats FIN code
 * @param fin - The FIN code to clean
 * @returns Cleaned FIN code or null
 */
export function cleanFIN(fin: string | null | undefined): string | null {
  if (!fin) return null;
  const cleaned = fin.trim().toUpperCase();
  return cleaned.length === 7 ? cleaned : null;
}

/**
 * Checks if FIN code format is valid (quick check)
 * @param fin - The FIN code to check
 * @returns true if valid format, false otherwise
 */
export function isFINValid(fin: string | null | undefined): boolean {
  return validateFIN(fin).isValid;
}

