// Phone number formatting utilities for Azerbaijan phone numbers
// Format: +(994)-12-345-67-89 (display) -> +994123456789 (storage)

/**
 * Formats a phone number for display with mask +(994)-12-345-67-89
 */
export function formatPhoneNumber(value: string): string {
  // Remove all non-digit characters except +
  const cleaned = value.replace(/[^\d+]/g, '');
  
  // If it doesn't start with +994, add it
  let digits = cleaned;
  if (!cleaned.startsWith('+994')) {
    // Remove any leading + or 994
    digits = cleaned.replace(/^\+?994?/, '');
    digits = '+994' + digits;
  }
  
  // Extract just the digits after +994
  const phoneDigits = digits.replace('+994', '');
  
  // Limit to 9 digits after country code
  const limitedDigits = phoneDigits.slice(0, 9);
  
  // Apply the mask: +(994)-12-345-67-89
  let formatted = '+(994)';
  if (limitedDigits.length > 0) {
    formatted += '-' + limitedDigits.slice(0, 2);
  }
  if (limitedDigits.length > 2) {
    formatted += '-' + limitedDigits.slice(2, 5);
  }
  if (limitedDigits.length > 5) {
    formatted += '-' + limitedDigits.slice(5, 7);
  }
  if (limitedDigits.length > 7) {
    formatted += '-' + limitedDigits.slice(7, 9);
  }
  
  return formatted;
}

/**
 * Converts formatted phone number to clean format for API storage
 */
export function cleanPhoneNumber(formattedPhone: string): string {
  if (!formattedPhone) return '';
  
  // Remove all non-digit characters except +
  const cleaned = formattedPhone.replace(/[^\d+]/g, '');
  
  // Ensure it starts with +994
  if (!cleaned.startsWith('+994')) {
    const digits = cleaned.replace(/^\+?994?/, '');
    return '+994' + digits;
  }
  
  return cleaned;
}

/**
 * Validates Azerbaijan phone number format
 */
export function validateAzerbaijanPhone(phone: string): boolean {
  const cleaned = cleanPhoneNumber(phone);
  // Azerbaijan mobile numbers: +994 followed by 9 digits
  // Valid prefixes: 50, 51, 55, 70, 77, 99, etc.
  const regex = /^\+994[0-9]{9}$/;
  return regex.test(cleaned);
}

