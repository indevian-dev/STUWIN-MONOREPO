import { format, formatDistanceToNow } from 'date-fns';

/**
 * Format a date to a readable string
 */
export function formatDate(date: string | Date, formatString: string = 'PPP'): string {
  return format(new Date(date), formatString);
}

/**
 * Format a date as relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

/**
 * Format a date to a specific format
 */
export function formatDateTime(date: string | Date): string {
  return format(new Date(date), 'PPpp');
}

/**
 * Format date to ISO string
 */
export function toISOString(date: string | Date): string {
  return new Date(date).toISOString();
}

