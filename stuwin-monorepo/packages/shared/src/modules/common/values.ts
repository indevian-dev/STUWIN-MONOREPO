// ═══════════════════════════════════════════════════════════════
// VALUE OBJECTS
// ═══════════════════════════════════════════════════════════════
// Domain-specific value objects with validation and business rules
// ═══════════════════════════════════════════════════════════════

import type { Location } from './base';

// ═══════════════════════════════════════════════════════════════
// MONEY & PRICING
// ═══════════════════════════════════════════════════════════════

export interface Money {
  amount: number; // in smallest currency unit (e.g., cents for USD)
  currency: string; // ISO 4217 currency code (e.g., 'USD', 'EUR')
}

export namespace Money {
  export const ZERO = { amount: 0, currency: 'USD' } as const;

  export function create(amount: number, currency = 'USD'): Money {
    if (amount < 0) throw new Error('Amount cannot be negative');
    if (!currency.match(/^[A-Z]{3}$/)) throw new Error('Invalid currency code');

    return { amount: Math.round(amount), currency };
  }

  export function add(a: Money, b: Money): Money {
    if (a.currency !== b.currency) throw new Error('Cannot add different currencies');
    return { amount: a.amount + b.amount, currency: a.currency };
  }

  export function format(money: Money, locale = 'en-US'): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: money.currency,
    }).format(money.amount / 100); // Convert cents to dollars
  }
}

// ═══════════════════════════════════════════════════════════════
// PHONE NUMBERS
// ═══════════════════════════════════════════════════════════════

export interface PhoneNumber {
  countryCode: string; // e.g., '+994' for Azerbaijan
  number: string; // local number without country code
  isVerified: boolean;
}

export namespace PhoneNumber {
  export function create(countryCode: string, number: string): PhoneNumber {
    // Remove all non-digit characters except +
    const cleanCountryCode = countryCode.replace(/[^\d+]/g, '');
    const cleanNumber = number.replace(/\D/g, '');

    if (!cleanCountryCode.startsWith('+')) {
      throw new Error('Country code must start with +');
    }

    if (cleanNumber.length < 7 || cleanNumber.length > 15) {
      throw new Error('Invalid phone number length');
    }

    return {
      countryCode: cleanCountryCode,
      number: cleanNumber,
      isVerified: false,
    };
  }

  export function format(phone: PhoneNumber): string {
    return `${phone.countryCode} ${phone.number}`;
  }

  export function toE164(phone: PhoneNumber): string {
    return `${phone.countryCode}${phone.number}`;
  }
}

// ═══════════════════════════════════════════════════════════════
// EMAIL ADDRESSES
// ═══════════════════════════════════════════════════════════════

export interface EmailAddress {
  address: string;
  isVerified: boolean;
  isPrimary: boolean;
}

export namespace EmailAddress {
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  export function create(address: string): EmailAddress {
    const normalized = address.toLowerCase().trim();

    if (!EMAIL_REGEX.test(normalized)) {
      throw new Error('Invalid email address format');
    }

    return {
      address: normalized,
      isVerified: false,
      isPrimary: false,
    };
  }

  export function isValid(address: string): boolean {
    return EMAIL_REGEX.test(address.toLowerCase().trim());
  }
}

// ═══════════════════════════════════════════════════════════════
// ADDRESSES
// ═══════════════════════════════════════════════════════════════

export interface Address {
  street: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
  coordinates?: Location;
}

export namespace Address {
  export function create(data: {
    street: string;
    city: string;
    country: string;
    state?: string;
    postalCode?: string;
    coordinates?: Location;
  }): Address {
    if (!data.street.trim() || !data.city.trim() || !data.country.trim()) {
      throw new Error('Street, city, and country are required');
    }

    return {
      street: data.street.trim(),
      city: data.city.trim(),
      state: data.state?.trim(),
      postalCode: data.postalCode?.trim(),
      country: data.country.trim(),
      coordinates: data.coordinates,
    };
  }

  export function format(address: Address): string {
    const parts = [
      address.street,
      address.city,
      address.state,
      address.postalCode,
      address.country,
    ].filter(Boolean);

    return parts.join(', ');
  }
}

// ═══════════════════════════════════════════════════════════════
// TIME RANGES & SCHEDULES
// ═══════════════════════════════════════════════════════════════

export interface TimeRange {
  start: string; // ISO time string (HH:mm)
  end: string; // ISO time string (HH:mm)
}

export interface Schedule {
  dayOfWeek: number; // 0-6 (Sunday = 0)
  timeRanges: TimeRange[];
  isActive: boolean;
}

export namespace TimeRange {
  export function create(start: string, end: string): TimeRange {
    const startTime = new Date(`1970-01-01T${start}:00`);
    const endTime = new Date(`1970-01-01T${end}:00`);

    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      throw new Error('Invalid time format');
    }

    if (endTime <= startTime) {
      throw new Error('End time must be after start time');
    }

    return { start, end };
  }

  export function overlaps(a: TimeRange, b: TimeRange): boolean {
    const aStart = new Date(`1970-01-01T${a.start}:00`);
    const aEnd = new Date(`1970-01-01T${a.end}:00`);
    const bStart = new Date(`1970-01-01T${b.start}:00`);
    const bEnd = new Date(`1970-01-01T${b.end}:00`);

    return aStart < bEnd && bStart < aEnd;
  }
}

// ═══════════════════════════════════════════════════════════════
// PERCENTAGES & RATES
// ═══════════════════════════════════════════════════════════════

export interface Percentage {
  value: number; // 0-100
}

export namespace Percentage {
  export function create(value: number): Percentage {
    if (value < 0 || value > 100) {
      throw new Error('Percentage must be between 0 and 100');
    }

    return { value };
  }

  export function fromDecimal(decimal: number): Percentage {
    return create(decimal * 100);
  }

  export function toDecimal(percentage: Percentage): number {
    return percentage.value / 100;
  }
}

// ═══════════════════════════════════════════════════════════════
// FILE SIZES
// ═══════════════════════════════════════════════════════════════

export interface FileSize {
  bytes: number;
}

export namespace FileSize {
  export const KB = 1024;
  export const MB = KB * 1024;
  export const GB = MB * 1024;

  export function create(bytes: number): FileSize {
    if (bytes < 0) throw new Error('File size cannot be negative');
    return { bytes };
  }

  export function format(size: FileSize): string {
    if (size.bytes >= GB) {
      return `${(size.bytes / GB).toFixed(2)} GB`;
    } else if (size.bytes >= MB) {
      return `${(size.bytes / MB).toFixed(2)} MB`;
    } else if (size.bytes >= KB) {
      return `${(size.bytes / KB).toFixed(2)} KB`;
    } else {
      return `${size.bytes} bytes`;
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// OTP CODES
// ═══════════════════════════════════════════════════════════════

export interface OtpCode {
  code: string;
  expiresAt: Date;
  attempts: number;
  maxAttempts: number;
}

export namespace OtpCode {
  export const DEFAULT_LENGTH = 6;
  export const DEFAULT_MAX_ATTEMPTS = 3;
  export const DEFAULT_EXPIRY_MINUTES = 10;

  export function generate(length = DEFAULT_LENGTH): string {
    const digits = '0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += digits[Math.floor(Math.random() * digits.length)];
    }
    return result;
  }

  export function create(code?: string): OtpCode {
    const generatedCode = code || generate();

    return {
      code: generatedCode,
      expiresAt: new Date(Date.now() + DEFAULT_EXPIRY_MINUTES * 60 * 1000),
      attempts: 0,
      maxAttempts: DEFAULT_MAX_ATTEMPTS,
    };
  }

  export function isExpired(otp: OtpCode): boolean {
    return new Date() > otp.expiresAt;
  }

  export function canAttempt(otp: OtpCode): boolean {
    return !isExpired(otp) && otp.attempts < otp.maxAttempts;
  }

  export function verify(otp: OtpCode, inputCode: string): boolean {
    if (!canAttempt(otp)) return false;
    if (otp.code !== inputCode) {
      otp.attempts++;
      return false;
    }
    return true;
  }
}
