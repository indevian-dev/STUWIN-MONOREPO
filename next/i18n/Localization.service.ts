import { routing } from '@/i18n/routing';
import type { NextRequest } from 'next/server';

import { ConsoleLogger } from '@/lib/logging/Console.logger';
export class LocalizationService {

  static async createIntlMiddleware() {

    try {
      // Lazy load only when needed
      const [{ default: createIntlMiddleware }, { routing }] = await Promise.all([
        import('next-intl/middleware'),
        import('@/i18n/routing')
      ]);
      return createIntlMiddleware(routing);
    } catch (error) {
      ConsoleLogger.warn('next-intl not configured:', error);
      return null;
    }
  }

  static getLocaleFromRequest(request: NextRequest): string {
    const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
    const headerLocale = request.headers.get('x-locale');
    const locale = cookieLocale || headerLocale || null;

    // Type guard to check if locale is valid
    const isValidLocale = (loc: string | null): loc is 'az' | 'ru' | 'en' => {
      return loc !== null && (routing.locales as readonly string[]).includes(loc);
    };

    return (isValidLocale(locale) ? locale : routing?.defaultLocale) || 'en';
  }
}

