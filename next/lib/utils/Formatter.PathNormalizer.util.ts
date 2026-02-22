/**
 * Utility for normalizing paths for routing and matching
 */
export class PathNormalizerUtility {
  /**
   * Normalizes a path for routing purposes
   * 1. Removes trailing slashes
   * 2. Ensures leading slash
   * 3. Handles dynamic segments if needed (basic)
   */
  static normalizeForRouting(path: string): string {
    if (!path) return '/';

    // Ensure leading slash
    let normalized = path.startsWith('/') ? path : `/${path}`;

    // Remove trailing slash if length > 1
    if (normalized.length > 1 && normalized.endsWith('/')) {
      normalized = normalized.slice(0, -1);
    }

    // Strip locale prefixes (/az, /ru, /en)
    const localeRegex = /^\/(az|ru|en)(\/|$)/;
    const match = normalized.match(localeRegex);
    if (match) {
      normalized = normalized.replace(localeRegex, '/');
      // Re-normalize to ensure no trailing slash if it was just /az/
      if (normalized.length > 1 && normalized.endsWith('/')) {
        normalized = normalized.slice(0, -1);
      }
    }

    return normalized;
  }
}
